// Use Node.js runtime to avoid Edge compiler import limitations

import app from '../dist/server/server.js';

export default async function handler(request) {
  return app.fetch(request, process.env, {});
}
