# Manual QA Checklist - Edge Case Sweep

Use this checklist during exploratory QA runs after automated suites finish.

## Test Session Metadata

- Date:
- Tester:
- Build/Branch:
- Environment (local/staging/prod):
- Browser/Device:

## 1) Giant PDF Test

### Goal
Verify ingestion UX remains responsive and failure handling is graceful for large files.

### Steps
1. Log in and open Refinement Lab.
2. Upload a large PDF (~50 pages).
3. Observe the UI while processing begins.
4. Wait until ingest completes or times out.

### Expected Result
- A clear loading/progress state is visible while parsing.
- UI remains interactive and does not hard-freeze.
- If parsing/AI fails, a readable error toast/message is shown.
- The app stays mounted and recoverable (no white screen/crash).

### Result
- Status: PASS / FAIL
- Notes:
- Screenshot/Video:

## 2) Spam Click Test (Theater Mode)

### Goal
Validate stability under high-frequency keyboard inputs and rapid grade mutations.

### Steps
1. Open Theater Mode with a deck that has cards.
2. Press Space and key 1 rapidly (about 20 inputs each, alternating quickly).
3. Repeat once more during an active card transition.

### Expected Result
- Card state does not duplicate or desync.
- No visual tearing/glitching across card transitions.
- Grade mutation calls complete without causing a stuck loading state.
- Session progression remains consistent (no skipped or duplicated cards).

### Result
- Status: PASS / FAIL
- Notes:
- Screenshot/Video:

## 3) Token Expiration Test

### Goal
Ensure auth guard behavior is smooth when token storage is missing or stale.

### Steps
1. Log in and land on Dashboard.
2. Open browser Local Storage and delete token/session entries.
3. Navigate to Library via UI or direct URL.

### Expected Result
- User is redirected to Login promptly.
- No blank/partially rendered protected dashboard shell.
- Optional toast/message can explain session expiration.

### Result
- Status: PASS / FAIL
- Notes:
- Screenshot/Video:

## 4) Responsive Dashboard/Library Check (Phone)

### Goal
Confirm table and content layouts remain usable on narrow screens.

### Steps
1. Open Dashboard and Library on a phone (or responsive emulator).
2. Inspect deck tables/cards and any horizontal data layout.
3. Try horizontal scrolling where applicable.

### Expected Result
- Content does not overflow the viewport irrecoverably.
- Data-heavy areas allow horizontal scroll instead of breaking layout.
- Key controls remain tappable and readable.

### Result
- Status: PASS / FAIL
- Notes:
- Screenshot/Video:

## Defect Logging Template

- Title:
- Severity: Critical / High / Medium / Low
- Area: Ingestion / Practice / Auth / Responsive
- Reproduction Steps:
- Expected:
- Actual:
- Frequency: Always / Intermittent
- Artifacts: Screenshot / Video / Console Log / Network Trace
