const crypto = require('crypto');


function queryString(params) {
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

async function twitter(method, apiBaseUrl, queries, formData) {
  const oauths = {
    oauth_consumer_key: TWITTER_CONSUMER_KEY,
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0",
    oauth_timestamp: `${Math.floor(Date.now() / 1000)}`,
    oauth_nonce: crypto.randomBytes(32).toString('base64'),
  };
  const params = { ...oauths, ...queries, ...formData };

  const paramsString = queryString(params);

  const signatureBaseString = [
    method,
    encodeURIComponent(apiBaseUrl),
    encodeURIComponent(paramsString)
  ].join('&');

  const signingKey = `${TWITTER_CONSUMER_SECRET}&${TWITTER_ACCESS_TOKEN_SECRET}`;

  const hmac = crypto.createHmac('sha1', signingKey)
  hmac.update(signatureBaseString)

  Object.assign(oauths, { oauth_signature: hmac.digest('base64') });

  let finalUrl = apiBaseUrl;
  if (Object.keys(queries).length > 0) {
    finalUrl = apiBaseUrl + '?' + queryString(queries);
  }

  const res = await fetch(finalUrl, {
    method,
    headers: {
      Authorization: 'OAuth ' + Object.keys(oauths).map(key => `${key}="${encodeURIComponent(oauths[key])}"`).join(','),
    }
  });

  if (!res.ok) {
    throw await res.json();
  }
  return await res.json();
}

function render(key, value, tweet) {
  if (key === 'geo') return JSON.stringify(value, undefined, 2);
  if (key === 'in_reply_to_status_id_str') return `[@${tweet.in_reply_to_screen_name} #${value}](https://twitter.com/${tweet.in_reply_to_screen_name}/status/${value})`;
  return value;
}

async function backup(path, message, content) {
  const res = await fetch(`https://api.github.com/repos/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64')
    }),
    headers: {
      'User-Agent': 'tweet removal app',
      Authorization: `token ${GITHUB_TOKEN}`
    }
  });
  if (!res.ok) {
    throw await res.text();
  }
}

async function deleteTweet(tweet) {
  const { created_at, full_text, id_str, entities: { media } } = tweet;
  const ts = new Date(created_at);
  const time = ts.toISOString();
  const metaKeys = ['geo', 'coordinates', 'place', 'retweet_count', 'favorite_count', 'in_reply_to_status_id_str'];
  const md = `
> ${full_text}

| Key | Value|
| - | - |
| Time | ${time} |
${
  metaKeys.map(k => [k, tweet[k]])
    .filter(([, v]) => v)
    .map(([k, v]) => `| ${k} | ${render(k, v, tweet)} |`)
    .join('\n')
}
`;
  // for (const { media_url_https: url } of media ) {
  // TODO download media
  // }
  await backup(`${GITHUB_OWNER}/${GITHUB_REPO}/contents/${time.slice(0, 10).replace(/-/g, '/')}/${id_str}.md`, `backup tweet ${id_str}`, md);
  await twitter('POST', `https://api.twitter.com/1.1/statuses/destroy/${id_str}.json`, {}, {});
}

async function run(dryRun = false) {
  const tweets = await twitter('GET', 'https://api.twitter.com/1.1/statuses/user_timeline.json', {
    screen_name: TWITTER_USER,
    tweet_mode: 'extended',
  }, {});

  const toBeDeleted = tweets.filter(t => {
    const ts = (new Date(t.created_at)).getTime();
    return Date.now() - ts > +TWEET_TTL && t.entities.hashtags.filter(h => h.text === TWEET_HASH_TAG).length > 0
  })

  if (!dryRun) {
    await Promise.all(toBeDeleted.map(deleteTweet));
  }

  return toBeDeleted;
}

// below for CloudFlare:

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

const route = {
  '/': async () => await run(),
  '/dry-run':  async () => await run(true),
};

async function handleRequest(request) {
  const url = new URL(request.url)
  const handler = route[url.pathname];
  if (!handler) {
    return new Response("Not Found", {status: 404})
  }
  try {
    const deleted = await handler(request);
    return new Response(`deleted: ${JSON.stringify(deleted, undefined, 2)}.`, { status: 200 });
  } catch (e) {
    return new Response(`err: ${JSON.stringify(e, undefined, 2)}.`, { status: 500 });
  }
}
