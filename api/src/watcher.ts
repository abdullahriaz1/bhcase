import { chromium } from 'playwright';
import type { Page, Browser, BrowserContext } from 'playwright';
import { recordPrice } from './db.js';

type SiteConfig = {
  name: string;
  url: string;
  selector: string;
  clean?: (text: string) => string;
  price: number;
  productName: string;
  productSelector: string;
  productClean?: (text: string) => string;
  currency?: string;
};

export const sites: SiteConfig[] = [
  {
    name: 'Burkett',
    url: 'https://www.burkett.com/server-88711-3-compartment-condiment-caddy?srsltid=AfmBOor22mB-tLjqpcTNSkiocDV9-rGcGlB4TFqMmb-wqbUMB6u3KAyC',
    selector: '.price-final_price .price-wrapper .price',
    clean: (t) => t.trim(),
    price: 0.0,
    productName: '',
    productSelector: 'h1.page-title .base[data-ui-id="page-title-wrapper"]',
    productClean: (t) => t.trim(),
    currency: '',
  },
  {
    name: 'WebstaurantStore',
    url: 'https://www.webstaurantstore.com/server-wirewise-3-compartment-tiered-condiment-bar-with-1-9-size-jars-hinged-lids-and-serving-spoons/71888711.html',
    selector: '[data-testid="price-container"] .price',
    clean: (t) => t.split('/')[0]?.trim() || t,
    price: 0.0,
    productName: '',
    productSelector: 'h1.skip-to-main-target',
    productClean: (t) => t.trim(),
    currency: '',
  },
  {
    name: 'RestaurantSupply',
    url: 'https://www.restaurantsupply.com/products/server-products-88711-4-81-inch-wire-3-tier-condiment-caddy-black-with-jars?variant=46300334326014',
    selector: '.price__current .price',
    clean: (t) => t.trim(),
    price: 0.0,
    productName: '',
    productSelector: 'h1.product-title',
    productClean: (t) => t.trim(),
    currency: '',
  },
];

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let pages: Page[] = [];

// Initialize browser and pages once
export async function initBrowser() {
  if (browser) return; // Already initialized
  
  console.log('🚀 Initializing browser...');
  browser = await chromium.launch({ 
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768'
    ],
});
  context = await browser.newContext();

  // Open all tabs
  pages = await Promise.all(
    sites.map(() => context!.newPage())
  );

  // Navigate all pages simultaneously
  await Promise.all(
    pages.map((page, i) => page.goto(sites[i]!.url))
  );

  // Wait for all pages to load
  await Promise.all(
    pages.map(page => page.waitForLoadState('domcontentloaded'))
  );
  
  console.log('✅ Browser initialized');
}

// Scrape prices from already-loaded pages
export async function scrapePrices() {
  if (!browser || !pages.length) {
    await initBrowser();
  }

  console.log('\n🔄 Scraping prices...');
  
  // Reload all pages simultaneously
  await Promise.all(pages.map(page => page.reload()));
  
  // Wait for all pages to load
  await Promise.all(
    pages.map(page => page.waitForLoadState('domcontentloaded'))
  );

  // Scrape each site
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]!;
    const page = pages[i]!;
    
    const priceText = await page.textContent(site.selector);
    let priceValue = 0.0;
    let currency = '';
    
    if (priceText) {
      const cleanPrice = site.clean ? site.clean(priceText) : priceText.trim();
      
      // Extract currency symbol (first non-numeric character)
      const currencyMatch = cleanPrice.match(/[^\d.,\s-]+/);
      if (currencyMatch) {
        currency = currencyMatch[0];
      }
      
      // Extract numeric value from price (remove currency symbols, etc. and convert to number)
      priceValue = parseFloat(cleanPrice.replace(/[^0-9.-]+/g, '')) || 0.0;
    }

    // Update the site's price and currency in the sites array
    site.price = priceValue;
    site.currency = currency;
    
    // Record price in database
    if (priceValue > 0) {
      recordPrice(site.name, priceValue, currency || '$');
    }

		const productText = await page.textContent(site.productSelector);
		let cleanProduct = 'Product not found';
		if (productText) cleanProduct = site.productClean ? site.productClean(productText) : productText.trim();

		// Update the site's productName in the sites array
		site.productName = cleanProduct;

  }

  console.log('\n📊 Current prices:');
  sites.forEach(site => {
    console.log(`  ${site.name}: ${site.currency}${site.price.toFixed(2)}`);
  });
  
  return sites;
}

// Continuous watcher function (preserved for future use)
export async function runContinuousWatcher() {
  await initBrowser();
  
  const seconds = 1000;
  let attempt = 0;
  
  while (true) {
    attempt += 1;
    console.log(`\n🔄 Starting scrape cycle ${attempt}\n`);
    
    await scrapePrices();

    console.log(`\n⏳ Waiting ${seconds} ms before next cycle...`);
    await new Promise(resolve => setTimeout(resolve, seconds));
  }
}
