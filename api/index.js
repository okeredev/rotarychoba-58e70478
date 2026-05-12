import server from '../dist/server/index.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Extract standard Cloudflare/Edge fetch arguments
  const env = process.env || {};
  const ctx = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  };
  
  return await server.fetch(request, env, ctx);
}