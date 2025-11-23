# AI Agent Prompt — Backend Builder (Vercel + Supabase + Prisma + Whop)

You are an autonomous full-stack developer agent with full read/write access to this project directory.  
Your job: **build the backend API layer from scratch**, wire it to the existing frontend, verify each step locally in a Vercel-like environment, and ensure nothing conflicts with previous steps.  
Proceed **incrementally**, testing each step before continuing.  
If a step fails, **revert the last change**, attempt one fix, and if it still fails, stop and report.

---

## GLOBAL RULES

- Never write secrets into files. Only read them from environment variables.  
- Follow UTC for all date logic.  
- Keep API routes minimal: validate Whop token → call helper → return JSON.  
- After each step: run tests, commit changes, then continue.  
- Be idempotent: if something already exists, verify it works and skip creating duplicates.  
- Use Prisma Data Proxy or PgBouncer if available; handle serverless limitations.  
- If local env variables are missing, stop and ask the operator.
- Any command that takes >10s to run should be run by the user in a separate terminal.
---

## PROJECT ASSUMPTIONS

- Frontend lives in: `app/experiences/[experienceId]/`  
- API routes live in: `app/api/...`  
- Supabase client exists or will exist at: `lib/supabaseClient.ts`  
- Backend helpers live in: `lib/`  
- Prisma schema lives in: `prisma/schema.prisma`  
- Environment vars needed:  
  - `DATABASE_URL` or `PRISMA_DATA_PROXY_URL`  
  - `NEXT_PUBLIC_SUPABASE_URL`  
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  - `SUPABASE_SERVICE_ROLE_KEY`  
  - `WHOP_*` secrets  

---

## FAILURE POLICY
If any step fails:
	Revert last commit.
	Attempt one corrective fix.
	If still failing:
	Stop immediately.
Output:
	step number
	failing command
	stderr/stdout
	recommended manual fix.


## WORK PLAN (DO NOT SKIP ANY STEP)

---

### STEP 0 — SANITY & SAFETY CHECKS  
(Do **not** modify files yet)

1. Print summary of the project structure: check for `prisma/`, `lib/`, `app/api/`, and `lib/supabaseClient.ts`.  
2. Validate `.env.local` exists.  
   - If missing → create `.env.local.example`, stop, and request values.  
3. Validate required environment variables.  
4. Output a STEP 0 report and wait for operator approval.

---

### STEP 1 — PRISMA SETUP & SCHEMA

1. Ensure `prisma` + `@prisma/client` installed. Install if missing.  
2. If `prisma/schema.prisma` missing → create it with required models:  
   - User, Checkin, Photo, CommunityStats  
   - Enums: Role, CheckinType, MuscleGroup  
3. Add `lib/prisma.ts` singleton (serverless-safe).  
4. Run `npx prisma generate`.  
5. Apply schema:  
   - If Data Proxy is configured → `npx prisma db push`  
   - Else → `npx prisma migrate dev --name init`  
6. Verify with `npx prisma migrate status`.  
7. Commit: `feat(prisma): add schema and client`.

---

### STEP 2 — DB HELPERS / BUSINESS LOGIC

Create `lib/db-helpers.ts` with functions:
- `findOrCreateUser()`  
- `getTodaysCheckin()`  
- `createCheckin()` (enforce one/day, muscleGroup required for WORKOUT)  
- `updateStreakOnCheckin()`  
- `photoCompliance()`  
- `getPublicFeed()`  
- `getCommunityStats()`  
- `getCoachDashboard()`

Verification:
- Create a small Node test script in `scripts/` to call each helper with mock/dev DB data.  
- Run script; must return exit code 0.  
- Commit: `feat(db): add db-helpers`.

---

### STEP 3 — WHOP TOKEN AUTH

1. Create `lib/whop-auth.ts` with `verifyWhopToken(req)`  
   - Read `x-whop-user-token`  
   - Verify with Whop SDK or verification endpoint  
   - Return `{ whopUserId, payload }`  
2. Add small test script to verify token decoding.  
3. Commit: `feat(auth): add whop token verifier`.

---

### STEP 4 — API ROUTES (ONE ROUTE PER ACTION)

Create minimal server routes:

#### Required:
- `app/api/init-user/route.ts`
- `app/api/checkin/route.ts`
- `app/api/feed/route.ts`
- `app/api/community-stats/route.ts`
- `app/api/coach/dashboard/route.ts`

**Rules for each route:**
1. Import `verifyWhopToken`, `db-helpers`, `prisma`.  
2. Validate token → get `whop_user_id`.  
3. Perform only minimal logic (everything else in helpers).  
4. Return JSON with correct status codes.

**Verification:**  
Run `curl` tests against dev server for all routes.  
If a test fails: revert last change → attempt fix → retest → stop if still failing.

Commit: `feat(api): add core routes`.

---

### STEP 5 — SUPABASE PHOTO INTEGRATION

1. Ensure `lib/supabaseClient.ts` exists with `uploadPhoto()`.  
2. On server: validate incoming photo URLs belong to the correct Supabase bucket.  
3. Optionally implement a server helper to generate signed upload URLs using `SUPABASE_SERVICE_ROLE_KEY`.

**Verification:**  
- Upload a small test file → call `/api/checkin` → ensure photo record created.

Commit: `feat(media): integrate supabase photo flow`.

---

### STEP 6 — PERFORMANCE & SAFETY

1. Add Prisma indexes (if missing):  
   - `(whopUserId, checkDate)`  
   - `User(lastActiveDate)`  
   - `Checkin(createdAt)`  
   - `Photo(isPublic, createdAt)`  
2. Add caching headers to GET routes.  
3. Warn operator if no pool/Data Proxy is configured.

Verification:
- Curl GET routes and confirm caching headers.  
- Run `prisma migrate dev` for index changes.

Commit: `perf(api): add indexes + caching headers`.

---

### STEP 7 — BUILD, TEST, FINAL REPORT

1. Run `npm run build` or `tsc`.  
2. Run full curl suite again.  
3. If all pass → commit:  
   `chore(api): backend complete and verified`.

4. Write final report at `tmp/deploy-report.json`:
   ```json
   {
     "timestamp": "<ISO>",
     "prisma": {
       "migrationsApplied": true,
       "schemaHash": "<sha>"
     },
     "routesTested": [
       "init-user",
       "checkin",
       "feed",
       "community-stats",
       "coach-dashboard"
     ],
     "testsPassing": true
   }
