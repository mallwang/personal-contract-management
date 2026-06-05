# Quickstart Validation Guide: Contract Icon Visuals

## Prerequisites

- Node.js LTS + pnpm installed
- Backend running (`pnpm --filter backend dev`) or mock data available
- Frontend dev server running (`pnpm --filter frontend dev`)

## Scenario 1: Category Icons in Contract List

**Goal**: Confirm every contract row shows a distinct category icon.

**Steps**:
1. Start the app: `pnpm dev`
2. Navigate to `/contracts`
3. Ensure at least one contract exists per category (UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER)

**Expected outcomes**:
- Each row in the contract table displays a small icon before (or beside) the category label
- Icons differ visually across categories
- No row is missing an icon (the fallback `FileText` icon satisfies this for unknown categories)

---

## Scenario 2: Provider Logo in Contract List

**Goal**: Confirm provider logos appear for known providers.

**Steps**:
1. Create a contract with `serviceUrl = https://www.netflix.com` and name `Netflix`
2. Navigate to `/contracts`

**Expected outcome**:
- The Netflix contract row shows a small Netflix favicon/logo next to the contract name
- Logo loads without layout shift

---

## Scenario 3: Fallback Icon for Unknown Provider

**Goal**: Confirm the fallback icon appears for unknown providers.

**Steps**:
1. Create a contract with `name = LocalGymXYZ` and no `serviceUrl`
2. Navigate to `/contracts`

**Expected outcome**:
- The contract row shows a generic `Building2` icon (no broken image)
- Icon appears immediately — no delay or flicker

---

## Scenario 4: Logo Preview in Contract Form

**Goal**: Confirm the provider logo preview appears while creating/editing a contract.

**Steps**:
1. Navigate to `/contracts/new`
2. Enter `Spotify` in the Name field
3. Enter `https://www.spotify.com` in the Service URL field

**Expected outcome**:
- A small Spotify favicon/logo appears as a preview in the form (adjacent to the service URL field or name field)
- The preview updates when the service URL changes

---

## Scenario 5: Anonymization Hides Provider Logo

**Goal**: Confirm that anonymized contracts don't leak provider identity through logos.

**Steps**:
1. Create a contract with `serviceUrl = https://www.spotify.com` and `anonymize = true`
2. Navigate to `/contracts`

**Expected outcome**:
- The contract row shows only the fallback `Building2` icon, not the Spotify logo
- Same behaviour when the global anonymization toggle is enabled

---

## Scenario 6: Offline Fallback

**Goal**: Confirm graceful fallback when the network is unavailable.

**Steps**:
1. Open DevTools → Network → set throttling to "Offline"
2. Navigate to `/contracts`

**Expected outcome**:
- All provider logo slots show the fallback `Building2` icon
- No broken-image indicators visible
- Category icons (Lucide, bundled) still render normally

---

## Unit Test Run

```bash
pnpm --filter frontend test
```

All tests in `CategoryIcon.test.tsx` and `ProviderLogo.test.tsx` must pass.

---

## E2E Test Run

```bash
pnpm --filter frontend test:e2e
```

Playwright tests covering Scenarios 1–3 must pass.
