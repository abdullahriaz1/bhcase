import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { initBrowser, scrapePrices, sites } from './watcher.js';
import { getPrices, getPricesPaginated } from './db.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true
});

fastify.get('/prices', async (request: FastifyRequest, reply: FastifyReply) => {
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

fastify.get('/price-history-paginated', async (request: FastifyRequest<{
  Querystring: { site: string; offset?: string; limit?: string }
}>, reply: FastifyReply) => {
  const { site, offset, limit } = request.query;
  
  if (!site) {
    reply.code(400).send({ error: 'Site parameter is required' });
    return;
  }
  
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  const limitNum = limit ? parseInt(limit, 10) : 50;
  const result = getPricesPaginated(site, offsetNum, limitNum);
  
  reply.send({ site, ...result });
});

const start = async () => {
  try {
    // Start the Fastify server
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:8000');
    console.log('⏰ Price scraping will run every 3600 seconds (1 hour)');
    
    // Initialize browser and scrape prices once on startup
    await initBrowser();
    await scrapePrices();
    const seconds = 3600 * 1000;
    // Set up continuous scraping every 3600 seconds (1 hour)
    setInterval(async () => {
      try {
        console.log('\n⏰ Running scheduled price scrape...');
        await scrapePrices();
      } catch (error) {
        console.error('Error during scheduled scrape:', error);
      }
    }, seconds);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();