# TROUBLESHOOTING

## Gateway Won't Start

**Symptom**: `uvicorn: command not found` or Python import errors.

**Fix**:
```bash
cd docker/ai-gateway
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn main:app --port 8000 --host 0.0.0.0
```

---

## Gateway Status Shows "Offline" in UI

**Symptom**: Monitor page shows "Disconnected". Gateway is running but UI can't reach it.

**Check**:
1. Confirm gateway is running: `Invoke-RestMethod http://localhost:8000/health`
2. Confirm `LOCAL_AI_URL=http://localhost:8000` is set in `.env`
3. Restart Next.js after changing `.env`

---

## CUDA Not Detected

**Symptom**: GPU shows as unavailable in Gateway Monitor.

**Fix**:
```bash
# In AI Gateway venv
python -c "import torch; print(torch.cuda.is_available())"
```

If `False`:
- Reinstall PyTorch with CUDA: `pip install torch --index-url https://download.pytorch.org/whl/cu121`
- Verify CUDA toolkit is installed: `nvidia-smi`

---

## Generation Fails Immediately

**Symptom**: Job created but shows `Failed` status within seconds.

**Common causes**:
1. **Wrong provider_id** — The local gateway provider must exist in the database. Run `node scripts/seed-workflow-templates.js`.
2. **Gateway offline** — Check gateway is running on port 8000.
3. **VRAM insufficient** — Try the `nota-ai/bk-sdm-tiny` validation model (2 GB VRAM).

---

## "Foreign key constraint violated" Error

**Symptom**: Job creation returns 500 with FK error on `provider_id`.

**Fix**: Ensure the database is seeded with the local provider record:
```bash
node scripts/seed-workflow-templates.js
```

---

## Prisma Migration Errors

**Symptom**: `npx prisma db push` fails.

**Fix**:
```bash
# Reset the database (WARNING: deletes all data)
npx prisma migrate reset
npx prisma db push
```

---

## npm install Fails

**Symptom**: EPERM errors renaming files during install.

**Cause**: The Prisma query engine DLL is locked by a running Next.js process.

**Fix**: Stop all running Node processes, then re-run `npm install`.

---

## Generated Images Don't Appear in Asset Library

**Symptom**: Job completes but no image shows in the asset library.

**Fix**: The asset is saved in the database. Refresh the Asset Library page.
If still missing, check the `ProductionAsset` table in your database.

---

## Port 3000 Already In Use

**Symptom**: Next.js fails to start on port 3000.

**Fix**: The app defaults to port 3003 in dev mode. Check your `package.json` dev script.
Or kill the process: `npx kill-port 3000`
