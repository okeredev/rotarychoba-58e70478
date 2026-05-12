export const config = {
  runtime: 'edge',
};

import app from '../dist/server/server.js';

export default async function handler(request) {
  return app.fetch(request, process.env, {});
}
