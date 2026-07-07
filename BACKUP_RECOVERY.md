# Backup & Recovery Guide

## 1. Database Backups
Supabase automatically takes daily backups on Pro plans. If you are on a free tier or wish to manually backup:
- Use the Supabase CLI:
  ```bash
  supabase db dump -f db_backup.sql
  ```
- **Recovery**: Restore using standard `psql`:
  ```bash
  psql $DATABASE_URL < db_backup.sql
  ```

## 2. Model Cache Backup
The AI Gateway downloads large multi-gigabyte models to your local `.cache/huggingface` directory.
- **Backup**: If you plan to reinstall Windows or format your drive, manually copy `~/.cache/huggingface/hub` to an external drive.
- **Recovery**: Paste the folder back into `~/.cache/huggingface/hub` before starting the Gateway to instantly avoid hours of downloading.

## 3. Storage Backups
Supabase Storage holds the generated assets.
- **Backup**: Periodically sync the `assets` bucket to AWS S3 or a local drive using a tool like `rclone`.
- **Recovery**: Re-upload the files to the Supabase `assets` bucket preserving their filenames. The `ProductionAssetVersion` database records only store the string URLs, so as long as the URLs match, the application will recover instantly.

## 4. Recovering from Gateway Crashes
If the FastAPI Gateway crashes (e.g., due to power loss or out-of-memory errors):
1. Kill any zombie python processes:
   ```bash
   taskkill /F /IM python.exe
   ```
2. Restart the gateway:
   ```bash
   uvicorn main:app --port 8000
   ```
The Next.js application is stateless and resilient. Any generations that were in-flight during the crash will time out on the frontend, and the user can simply click "Generate" again. No corrupted states will be saved to the database.
