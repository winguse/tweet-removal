# Tweet auto clean up

Use CloudFlare worker to help you clean up your tweets automatically.


## Usage

0. Create [Twitter App](https://developer.twitter.com/en/apps/create)
    `App > YOUR_APP_NAME > Keys and tokens`, generate the four ids / tokens:
    - Consumer API keys
      - API key
      - API secret key
    - Access token & access token secret
      - Access token
      - Access token secret
1. Create Github Token [here](https://github.com/settings/tokens/new?scopes=repo&description=Tweet-Backup).
2. Clone this repo and config:
   - copy [`wrangler.sample.toml`](./wrangler.sample.toml) to `wrangler.toml`
   - edit `wrangler.toml` change `account_id = "YOUR_ACCOUNTT_ID"` to your own [CloudFlare account ID](https://developers.cloudflare.com/workers/quickstart#account-id-and-zone-id).
   - copy [`publish.sample`](./publish.sample) to `publish`, and edit config base on your credentials in step above.
3. Follow [CloudFlare Worker Quick Start](https://developers.cloudflare.com/workers/quickstart) for the following sections:
    - [Installing the CLI](https://developers.cloudflare.com/workers/quickstart#installing-the-cli)
      - [Updating the CLI](https://developers.cloudflare.com/workers/quickstart#updating-the-cli)
    - [Configure](https://developers.cloudflare.com/workers/quickstart#configure)
      - [Account ID and Zone ID](https://developers.cloudflare.com/workers/quickstart#account-id-and-zone-id)
      - [API Token](https://developers.cloudflare.com/workers/quickstart#api-token)
      - [Setup](https://developers.cloudflare.com/workers/quickstart#setup)
    - [Publish Your Project](https://developers.cloudflare.com/workers/quickstart#publish-your-project)
      - [Publish To workers.dev](https://developers.cloudflare.com/workers/quickstart#publish-to-workers-dev)
      - [Publish To Your Domain](https://developers.cloudflare.com/workers/quickstart#publish-to-your-domain)
4. Run `./publish`, and you can test with `https://tweet-removal.<YOUR_CF_ACCOUNT_NAME>.workers.dev/dry-run`.
5. Use service like [IFTT](https://ifttt.com/create/if-every-day-at?sid=4) to tiger the worker regularly.

