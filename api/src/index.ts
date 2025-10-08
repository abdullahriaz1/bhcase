import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { initBrowser, scrapePrices, sites } from './watcher.js';

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