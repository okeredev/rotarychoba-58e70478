import server from '../dist/server/index.js';
import { Readable } from 'node:stream';

export default async function handler(req, res) {
  // Convert Node.js IncomingMessage to Web Request
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value) {
      headers.set(key, value);
    }
  }

  const init = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }

  const request = new Request(url.href, init);

  const env = process.env || {};
  const ctx = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  };

  try {
    const response = await server.fetch(request, env, ctx);

    // Convert Web Response to Node.js ServerResponse
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.statusCode = response.status || 200;

    if (response.body) {
      const stream = Readable.fromWeb(response.body);
      stream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Serverless function error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}