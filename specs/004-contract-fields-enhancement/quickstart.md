# Quickstart Validation Guide: Contract Fields Enhancement

## Prerequisites

- Dev environment running: `pnpm dev` (starts both backend on :3001 and frontend on :5173)
- At least one existing contract in the database (created before this feature) to test backwards compatibility

---

## Scenario 1: Create a contract with all four new fields

1. Navigate to `/contracts/new`
2. Fill in the required fields (name, category, amount, billing interval, status)
3. Set **Start Date** to any past or future date
4. Enter text in **Details** (e.g., "Annual subscription, renews automatically")
5. Enter a valid URL in **Service URL** (e.g., `https://netflix.com`)
6. Set **Cancellation Period** to `30 Days`
7. Click **Save**

**Expected**: Redirected to `/contracts`, new contract appears in list. Opening edit form for the new contract shows all four values pre-filled.

---

## Scenario 2: All four fields are optional

1. Navigate to `/contracts/new`
2. Fill in only required fields — leave start date, details, service URL, and cancellation period blank
3. Click **Save**

**Expected**: Contract is created successfully. No error. Edit form shows the new fields as empty.

---

## Scenario 3: Service URL validation rejects malformed input

1. Navigate to `/contracts/new`
2. Fill in required fields
3. Enter `not-a-url` in **Service URL**
4. Click **Save**

**Expected**: Save is blocked; a validation error message is displayed. The contract is not created.

---

## Scenario 4: Details character limit enforced

1. Navigate to `/contracts/new` or edit an existing contract
2. Paste 2,001+ characters into the **Details** field
3. The character counter should show the count turning red or reaching the limit indicator

**Expected**: Saving is blocked when the limit is exceeded. The counter visibly indicates the overflow.

---

## Scenario 5: Existing contract displays without errors

1. Before deploying this feature: note an existing contract in the database
2. After deploying this feature and running migrations: navigate to `/contracts`
3. Open the edit form for the pre-existing contract

**Expected**: The contract loads without errors. All four new fields appear as empty/unset. No broken layout.

---

## Scenario 6: Service URL renders as a clickable link

1. Create or edit a contract with a valid **Service URL** set (e.g., `https://spotify.com`)
2. After saving, open the edit form

**Expected**: The service URL is shown as a clickable hyperlink next to or below the URL input. Clicking it opens `https://spotify.com` in a new browser tab.

---

## Scenario 7: Cancellation period updates correctly

1. Edit an existing contract that has no cancellation period set
2. Set **Cancellation Period** to `2 Months`
3. Save; re-open the edit form

**Expected**: Cancellation period shows `2 Months`. 

4. Change it to `14 Days` and save; re-open

**Expected**: Shows `14 Days`. 

5. Clear both cancellation period fields and save; re-open

**Expected**: Cancellation period is empty/unset.

---

## Quick API Smoke Tests

```bash
# Create with all four new fields
curl -s -X POST http://localhost:3001/api/contracts \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Smoke Test","category":"SUBSCRIPTIONS","amount":9.99,
    "billingInterval":"MONTHLY","status":"ACTIVE",
    "startDate":"2025-01-01",
    "details":"Test notes",
    "serviceUrl":"https://example.com",
    "cancellationPeriod":{"value":30,"unit":"DAYS"}
  }' | jq '.startDate, .details, .serviceUrl, .cancellationPeriod'

# Should print: "2025-01-01", "Test notes", "https://example.com", {"value":30,"unit":"DAYS"}

# Malformed URL → 400
curl -s -X POST http://localhost:3001/api/contracts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bad","category":"OTHER","amount":0,"billingInterval":"MONTHLY","status":"ACTIVE","serviceUrl":"not-a-url"}' | jq '.statusCode'
# Should print: 400
```
