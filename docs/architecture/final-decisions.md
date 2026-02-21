
Hosting — Phase Strategy
PHASE 1: Development (NOW)

Where: Your laptop, using docker-compose up

Cost: $0

Stack: NestJS + PostgreSQL + local files, all running in Docker.

PHASE 2: Real user testing (FREE)

Where: Oracle Cloud Free Tier — ALWAYS FREE, DOES NOT EXPIRE

Cost: $0/month, no time limit.

What you get for free on Oracle:

ARM Ampere VM: 4 CPUs, 24GB RAM (~10x more than you need).

200GB block storage.

10GB object storage (for photos/PDFs).

10TB bandwidth/month.

What you run on Oracle:

Docker with: PostgreSQL + NestJS API + Nginx (reverse proxy + SSL).

Files (photos, PDFs) saved on disk with backups.

Setup: A single VM with docker-compose, and SSL via Let's Encrypt.

Why Oracle and not Azure: $0 permanently vs. a $100/year student credit that eventually expires.

PHASE 3: Production for the company (when the app is ready)

Where: The construction company's Azure environment (they pay for it).

Estimated cost: ~$50-70/month (a negligible expense for a construction company).

What changes: Only the variables in your .env file:

DATABASE_URL → Azure PostgreSQL Flexible Server

STORAGE_PROVIDER=azure → Azure Blob Storage

REDIS_URL → Azure Cache for Redis (optional)

Zero code changes — you deploy the exact same Docker image.