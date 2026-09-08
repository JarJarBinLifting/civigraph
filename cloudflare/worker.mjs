import handler from '../.open-next/worker.js';

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const publicHost = url.hostname === 'civigraph.org' || url.hostname === 'www.civigraph.org';
    if (publicHost && (url.protocol !== 'https:' || url.hostname !== 'civigraph.org')) {
      url.protocol = 'https:';
      url.hostname = 'civigraph.org';
      url.port = '';
      return Response.redirect(url.href, 301);
    }
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
