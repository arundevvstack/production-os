# DP Creative OS — Upgrade Guide

## Upgrading to v1.0.0-rc1

### Database Migrations
This release contains the new `ProductionTimelineEvent` table.
You must run:
```bash
npx prisma db push
npx prisma generate
```

### Breaking Changes
- The `api/v1/crm` endpoints no longer exist. Any external webhooks or Zapier integrations targeting the CRM system will return `404`. Please route all integrations to the new `api/v1/projects` endpoints.
- Authentication now strictly requires `company_id` matching for workspace isolation. Ensure all users in your DB have a valid `company_id` assigned.
