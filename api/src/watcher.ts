import { chromium } from 'playwright';
import type { Page, Browser, BrowserContext } from 'playwright';

type SiteConfig = {
  name: string;
  url: string;
  selector: string;
  clean?: (text: string) => string;
  priceText: string;
  productName: string;
  productSelector: string;
  productClean?: (text: string) => string;
};

export const sites: SiteConfig[] = [
  {
    name: 'Katom',
    url: 'https://www.katom.com/003-88711.html',
    selector: '.product-price-text',
    clean: (t) => t.split(' ')[0]?.trim() || t,
    priceText: '$0.00',
    productName: '',
    productSelector: 'h1.product-name',
    productClean: (t) => t.trim(),
  },
  {
    name: 'WebstaurantStore',
    url: 'https://www.webstaurantstore.com/server-wirewise-3-compartment-tiered-condiment-bar-with-1-9-size-jars-hinged-lids-and-serving-spoons/71888711.html',
    selector: '[data-testid="price-container"] .price',
    clean: (t) => t.split('/')[0]?.trim() || t,
    priceText: '$0.00',
    productName: '',
    productSelector: 'h1.skip-to-main-target',
    productClean: (t) => t.trim(),
  },
  {
    name: 'RestaurantSupply',
    url: 'https://www.restaurantsupply.com/products/server-products-88711-4-81-inch-wire-3-tier-condiment-caddy-black-with-jars?variant=46300334326014',
    selector: '.price__current .price',
    clean: (t) => t.trim(),
    priceText: '$0.00',
    productName: '',
    productSelector: 'h1.product-title',
    productClean: (t) => t.trim(),
  },
];

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let pages: Page[] = [];

// Initialize browser and pages once
export async function initBrowser() {
  if (browser) return; // Already initialized
  
  console.log('🚀 Initializing browser...');
  browser = await chromium.launch({ headless: false });
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
    let cleanPrice = 'Price not found';
    if (priceText) cleanPrice = site.clean ? site.clean(priceText) : priceText.trim();

    // Update the site's priceText in the sites array
    site.priceText = cleanPrice;

		const productText = await page.textContent(site.productSelector);
		let cleanProduct = 'Product not found';
		if (productText) cleanProduct = site.productClean ? site.productClean(productText) : productText.trim();

		// Update the site's productName in the sites array
		site.productName = cleanProduct;

  }

  console.log('\n📊 Current prices:');
  sites.forEach(site => {
    console.log(`  ${site.name}: ${site.priceText}`);
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
