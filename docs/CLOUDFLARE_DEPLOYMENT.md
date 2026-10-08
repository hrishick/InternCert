# Cloudflare Deployment Guide

Follow these steps to deploy **InternCert** to Cloudflare Pages (Frontend) and Cloudflare Workers (Backend) with Cloudflare D1 and R2 storage.

---

## 1. Cloudflare D1 Database Setup

```bash
# 1. Create Cloudflare D1 database instance
npx wrangler d1 create interncert-db

# 2. Apply Schema & Seed to D1 (Remote)
npx wrangler d1 execute interncert-db --file=./database/schema.sql --remote
npx wrangler d1 execute interncert-db --file=./database/seed.sql --remote
```

Copy the generated `database_id` into `backend/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "interncert-db"
database_id = "your-database-id-here"
```

---

## 2. Cloudflare R2 Object Storage Bucket Setup

```bash
# Create R2 bucket for certificates
npx wrangler r2 bucket create interncert-certificates
```

Add binding to `backend/wrangler.toml`:
```toml
[[r2_buckets]]
binding = "CERT_STORAGE"
bucket_name = "interncert-certificates"
```

---

## 3. Deploy Backend Worker API

```bash
cd backend
npx wrangler deploy
```

Your API will be deployed globally on `https://interncert-api.<your-subdomain>.workers.dev`.

---

## 4. Deploy Frontend to Cloudflare Pages

```bash
cd frontend

# Build production bundle
npm run build

# Deploy dist directory to Cloudflare Pages
npx wrangler pages deploy dist --project-name=interncert
```

---

## 5. Configure Secrets & Environment Variables

```bash
# Set JWT Secret
npx wrangler secret put JWT_SECRET

# (Optional) Set Gmail OAuth Credentials
npx wrangler secret put GMAIL_CLIENT_ID
npx wrangler secret put GMAIL_CLIENT_SECRET
npx wrangler secret put GMAIL_REFRESH_TOKEN
```
