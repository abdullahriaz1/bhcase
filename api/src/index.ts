import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { initBrowser, scrapePrices, sites } from './watcher.js';
import { getPrices } from './db.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

fastify.get('/prices', async (request: FastifyRequest, reply: FastifyReply) => {
  await scrapePrices();
  reply.send({ sites });
});

fastify.get('/price-history', async (request: FastifyRequest<{
  Querystring: { site: string; limit?: string }
}>, reply: FastifyReply) => {
  const { site, limit } = request.query;
  
  if (!site) {
    reply.code(400).send({ error: 'Site parameter is required' });
    return;
  }
  
  const limitNum = limit ? parseInt(limit, 10) : 50;
  const priceHistory = getPrices(site, limitNum);
  
  reply.send({ site, priceHistory });
});

const start = async () => {
  try {
    // Initialize browser and scrape prices once on startup
    await initBrowser();
    await scrapePrices();
    
    // Start the Fastify server
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();