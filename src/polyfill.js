import fetch, {Headers, Request, Response} from 'node-fetch';
import options from './options.js';

import http from 'node:http';
import https from 'node:https';

const httpAgent = new http.Agent();
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const fetchOptions = {
  agent: function (_parsedURL) {
    if (_parsedURL.protocol == 'http:') {
      return httpAgent;
    } else {
      return httpsAgent;
    }
  },
};

if (!globalThis.fetch) {
  globalThis.fetch = async (url, opts) => fetch(url, {...opts, ...fetchOptions});
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

if (!globalThis.location) {
  globalThis.location = {origin: options.vedaUrl};
}
