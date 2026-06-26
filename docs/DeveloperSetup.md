# DP Creative OS — Developer Setup

Follow these steps to run DP Creative OS locally.

## Prerequisites
- Node.js (v20+)
- PostgreSQL Database (Local or Supabase)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd "Media OS V.1"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/media_os"
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```

4. **Database Setup**:
   Sync the Prisma schema to your database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

6. **Access the Platform**:
   Open `http://localhost:3000` in your browser.
