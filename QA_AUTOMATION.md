# QA Automation Guide

## Phase 1 - Backend Load Test (K6)

### Script
- File: stress-test.js

### Scenario
- Ramp to 50 VUs over 1 minute
- Hold 50 VUs for 3 minutes
- Ramp down to 0 over 1 minute

### Flow per VU
1. POST /api/auth/login
2. GET /api/analytics/mastery
3. POST /api/ingest with a mocked PDF file payload

### Thresholds
- p95 latency under 500ms: p(95) < 500
- Request failure rate under 1%: rate < 0.01

### Run
1. Install K6: https://k6.io/docs/get-started/installation/
2. Optional env setup:
   - BASE_URL=http://localhost:5000
   - K6_EMAIL=<existing-user-email>
   - K6_PASSWORD=<existing-user-password>
3. Execute:
   - k6 run stress-test.js

## Phase 2 - Golden Path E2E (Playwright)

### Files
- playwright.config.ts
- tests/e2e/user-flow.spec.ts

### What it validates
1. Home page renders and Start Studying CTA is visible.
2. Login form works and redirects to /dashboard.
3. Good Morning header appears on dashboard.
4. Theater Mode receives Space flip + 3 grade input.
5. SM-2 grade mutation is called.

### Report behavior
- Headless execution enabled.
- HTML report generated in playwright-report.
- Trace/screenshot/video retained on failure.

### Run
- npm run test:e2e:golden
- npm run test:e2e
- npm run test:e2e:report

## Phase 3 - Manual Edge-Case Sweep

### Checklist file
- QA_MANUAL_CHECKLIST.md

### Includes
- Giant PDF ingestion behavior
- Spam keyboard mutation stress in Theater Mode
- Token deletion / auth guard behavior
- Mobile responsive table scrolling behavior in Library
