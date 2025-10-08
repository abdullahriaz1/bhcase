# SKU Price Tracker

A full-stack application for tracking and visualizing product prices across multiple online stores.  
The current implementation monitors a *condiment caddy* SKU but can be adapted for any product.

---

## Demo
[Loom Video](https://www.loom.com/share/b9e92a677ad44a4e9b93875b0f3d6a7d?sid=5787750d-bd2d-47d5-bf95-d9e264a9ad57)


## 🧭 Overview

**SKU Price Tracker** periodically scrapes multiple online stores to retrieve the latest prices for a given product, stores them in a database, and exposes both real-time and historical data through a modern web interface.

---

## 🖥️ Frontend — Next.js

- Built with **Next.js** for a fast, reactive, and server-rendered user experience.  
- Frontend has been deployed to **Vercel** at [bhcase.vercel.app](bhcase.vercel.app) but is not connected to the backend.
- Displays current prices from **three online shops** for the tracked SKU.  
- Periodically fetches updated prices from the backend.  
- Includes a **paginated price history view** for each store, enabling users to analyze trends over time.

---

## ⚙️ Backend — Fastify + Playwright

- Implemented in **TypeScript** using the **Fastify** web framework.  
- Utilizes **Playwright** for headful browser automation to scrape the latest prices.  
- Extracts price data via precise **DOM selectors** for each store.  
- Stores prices in an **SQLite** database.  
- Scheduled scraping runs **every hour** (configurable to daily or other intervals).  

---

## 🗄️ Database — SQLite3

- Lightweight and efficient **SQLite3** backend.  
- Supports:
  - Insertion of new price records for each store.
  - Retrieval of historical prices with pagination support.
- Designed for local development or small-scale deployment, but can be migrated to a more robust SQL database for production.

---

## 🔍 Case Study & Challenges

### Bot Detection & Scraping Limitations
- Some stores (e.g., **Kratom**) employ **Cloudflare bot protection**, which blocks Playwright when running in headless mode.  
- Workarounds like running in headful mode were used but add more complexity.

### Deployment Challenges
- Deploying Playwright in **cloud environments** (like AWS EC2) can be non-trivial.  
- Headful browser mode requires graphical dependencies and additional configuration to run in virtualized environments.

### Scalability Considerations
To scale this system for multiple products:
- Need to track **all SKUs** efficiently.  
- Consider implementing:
  - Product **name normalization** or **UPC consolidation** to avoid duplication.  
  - Distributed scraping jobs using **cloud workers or containers**.  
  - Centralized data collection and visualization services.

---

## 🚀 Future Improvements

- [ ] Add authentication and API rate limiting.  
- [ ] Integrate a more durable database (PostgreSQL).  
- [ ] Add data visualization (charts for price trends).  
- [ ] Automate deployment with Docker.  
- [ ] Introduce monitoring for scraper reliability.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js, React |
| Backend | TypeScript, Fastify |
| Web Scraping | Playwright |
| Database | SQLite3 |
---
