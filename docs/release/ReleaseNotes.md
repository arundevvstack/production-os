# Release Notes - DP Creative OS v1.0.0-rc1

## What's New
- **Graph Engine Core**: Finalized relationship algorithms to map Shots, Scenes, and Assets via `ProductionTimelineEvent`.
- **Generation Studio**: Stabilized the auto-injection of Creative Memories directly into external provider prompts.
- **Provider Framework**: Standardized abstract interface for mapping `OpenRouter` models into internal Asset schemas.
- **Production Monitoring**: Introduced `/api/health` for automated uptime polling and `logger.ts` for structured JSON logs.

## Deprecations
- **Legacy CRM System**: Complete removal of legacy `crm`, `finance`, and `prospect` API endpoints. The system is strictly a Media OS.
- **Client Portals**: Client-facing public portals have been disabled pending a v2.0 security rewrite.

## Known Limitations
- The Job Engine currently awaits API generation synchronously (can cause Vercel timeouts for slow models). Background queue (BullMQ) is scheduled for v1.1.
- Generation Studio only officially supports `Image` output via OpenRouter in RC1. Video support (Runway) will require a dedicated adapter.
