# DP Creative OS — Disaster Recovery

## Database Backups
Because the platform relies entirely on relational mapping (the Creative Knowledge Graph), data integrity is paramount.
- **Supabase PITR**: Point-in-Time Recovery must be enabled on the Supabase instance.
- **Daily Dumps**: A daily `pg_dump` cron job is recommended to an isolated AWS S3 bucket.

## Restoring from a Failure
If a destructive migration occurs:
1. Immediately pause Vercel deployments.
2. Use Supabase PITR to rewind the database exactly 1 minute before the destructive event.
3. Validate schema integrity locally using `npx prisma validate`.
4. Run `npx prisma generate` to re-sync the ORM client.
5. Unpause Vercel deployments.

## Provider Outages
If OpenRouter goes down, the `JobDispatcher` will automatically catch `503` errors. The UI will surface a standard "Provider Unavailable" error. Admins can hot-swap API keys or providers in the `ProviderManager.ts` file without altering UI code.
