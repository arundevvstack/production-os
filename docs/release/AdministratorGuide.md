# DP Creative OS — Administrator Guide

## Environment Variables
Administrators must configure the following in the production environment (e.g. Vercel):
- `DATABASE_URL`: Connection pooler string from Supabase (must include `?pgbouncer=true`).
- `DIRECT_URL`: Direct connection string for Prisma migrations.
- `OPENROUTER_API_KEY`: API Key for external AI generations.

## Role Management
User access is strictly scoped by `company_id`. To invite a new user:
1. They must register via the standard `/signup` flow.
2. Admins must manually update their `company_id` in the database to match the tenant workspace.

## Health Monitoring
Ping `GET /api/health` to verify database connectivity and system uptime. Return status `200` indicates a healthy connection.
