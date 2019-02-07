const https = require('https');
const querystring = require('querystring');
const moment = require('moment');

const FACEBOOK_API_KEY = process.env.CROWDTANGLE_FACEBOOK_API_KEY;
const TWITTER_API_KEY = process.env.CROWDTANGLE_TWITTER_API_KEY;
const INSTAGRAM_API_KEY = process.env.CROWDTANGLE_INSTAGRAM_API_KEY;
const BASE_URL = "https://api.crowdtangle.com";

class CrowdTangle {

  leaderboard(params) {
    let options = Object.assign(
      {
        token: INSTAGRAM_API_KEY,
        endDate: moment().format('YYYY-MM-DD'),
        startDate: moment().subtract(6, "months").format('YYYY-MM-DD'),
      },
    params);
    return execute("/leaderboard", options);
  }

  links(params) {
    return execute("/links", params);
  }

  twitterStream(params = {}) {
    let options = Object.assign(
      {
        token: TWITTER_API_KEY
      },
    params);

    return execute("/posts", options);
  }
}

function execute(endpoint, options = {}, format = "json") {
  const params = Object.assign({token: FACEBOOK_API_KEY}, options);
  const URL = buildURL(endpoint, params, format);

  console.log('calling CT', URL);
  return new Promise((resolve, reject) => {
    https.get(URL, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        const result = JSON.parse(data);
        resolve(result);
      });

    }).on("error", (err) => {
      reject(err);
    });
  });
}

function buildURL(endpoint, params, format) {
  return BASE_URL + endpoint + "." + format + "?" + querystring.stringify(params);
}


module.exports = CrowdTangle;
