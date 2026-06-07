**English** · [Deutsch](user-guide.de.md)

# User Guide

Personal Contract Management is a local web app that keeps all your contracts — streaming services, insurance policies, mobile plans, rent, utilities — in one place. It shows you what you spend each month, warns you before auto-renewals, and tells you when contracts have already expired.

## Table of contents

1. [Getting around](#1-getting-around)
2. [Dashboard](#2-dashboard)
3. [Contract list](#3-contract-list)
4. [Adding a contract](#4-adding-a-contract)
5. [Editing and deleting](#5-editing-and-deleting)
6. [Importing contracts](#6-importing-contracts)
7. [Exporting contracts](#7-exporting-contracts)
8. [Anonymization](#8-anonymization)
9. [Language](#9-language)
10. [Accounts & sign-in](#10-accounts--sign-in)
11. [Contract fields reference](#11-contract-fields-reference)

---

## 1. Getting around

The app has two main areas:

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Spending overview, renewals, expired contracts |
| Contracts | `/contracts` | Full list; create, import, export |

Use the navigation links at the top of each page to move between them. Every detail page has a back link in the top-left corner.

---

## 2. Dashboard

The dashboard opens when you visit the app. It gives you a snapshot of your current situation.

### Monthly spending

The large number at the top is the sum of all **active** contracts converted to a monthly figure:

| Billing interval | Conversion |
|-----------------|-----------|
| Weekly | × 52 ÷ 12 |
| Monthly | × 1 |
| Quarterly | ÷ 3 |
| Yearly | ÷ 12 |
| Lifetime | not included |

**Example:** You have Netflix at €12.99/month and a yearly gym membership at €240/year. The dashboard shows €12.99 + (€240 ÷ 12) = **€32.99/month**.

### Category breakdown

A table beneath the total groups your active contracts by category and shows how much each category costs per month, sorted from highest to lowest.

### Upcoming renewals

Any contract whose end date falls within the next 30 days appears here. Each row shows:

- Contract name
- End date
- **Cancellation deadline** — the last day to cancel without being locked in for another period (end date minus the notice period you set)
- Days remaining, colour-coded:
  - **Red** — deadline already passed
  - **Amber** — 7 days or fewer remaining
  - **Grey** — more than 7 days remaining

**Example:** Your mobile contract ends on 30 June with a 14-day cancellation notice. The cancellation deadline shown is 16 June. If today is 18 June the row turns red.

### Expired contracts

Contracts whose end date is in the past appear in an amber-highlighted panel. The panel shows how many days each contract is overdue. Click a row to go straight to the edit page.

---

## 3. Contract list

Open **Contracts** from the navigation to see all your contracts in a table.

### Sorting

Click any column header to sort by that column. Click again to reverse the order. A third click clears the sort. The active sort direction is shown with a small up or down arrow.

Available sort columns: Name, Category, Amount, Status, End Date.

### Toolbar

The row of controls above the table contains:

| Control | What it does |
|---------|-------------|
| Anonymization toggle | Hides real names (see [Anonymization](#8-anonymization)) |
| Export | Downloads all contracts as JSON or Excel |
| Import | Opens the import wizard |
| Add Contract | Opens the create form |

---

## 4. Adding a contract

Click **Add Contract** from the contract list. Fill in the form and click **Save**.

### Minimal example — streaming subscription

| Field | Value |
|-------|-------|
| Name | Netflix |
| Category | Subscriptions |
| Amount | 12.99 |
| Billing interval | Monthly |

That's all you need. The four fields above are required; everything else is optional.

### Fuller example — insurance policy

| Field | Value |
|-------|-------|
| Name | Home Contents Insurance |
| Category | Insurance |
| Amount | 180.00 |
| Billing interval | Yearly |
| Status | Active |
| Start date | 2024-03-01 |
| End date | 2025-03-01 |
| Cancellation notice | 4 Weeks |
| Service URL | https://myinsurer.example.com/account |
| Details | Policy number: INS-4821. Covers up to €50 000. |
| Anonymize | off |

With these values the dashboard will warn you on or before 1 February (28 days before the 1 March end date) that you need to act.

### Field notes

- **Status** defaults to Active. Set it to Inactive for contracts you have already cancelled but want to keep for reference.
- **Cancellation notice** requires both a number and a unit (Days / Weeks / Months / Years). If you leave it blank the dashboard treats the end date itself as the deadline.
- **Service URL** must be a valid URL if provided. It is not clickable in the table, but useful to copy from the edit form.
- **Details** accepts up to 2 000 characters. A counter appears when you approach the limit.
- **Anonymize** — tick this to always hide this specific contract's name regardless of the global toggle.

---

## 5. Editing and deleting

### Editing

Click the **Edit** link in a contract row to open the edit form. All fields are pre-filled. Make your changes and click **Save Changes**.

### Deleting

Click **Delete** in a contract row. The button changes to **Confirm** and **Cancel** inline — click **Confirm** to permanently remove the contract or **Cancel** to abort.

---

## 6. Importing contracts

Click **Import** from the contract list toolbar. The wizard has five steps.

### Step 1 — Upload

Drag and drop a file onto the upload area, or click to browse. Supported formats:

- **JSON** — an array of objects, e.g. exported from this app
- **Excel (.xlsx)** — one sheet with a header row

Maximum file size: 5 MB.

### Step 2 — Parse

The app reads the file and detects its columns automatically.

### Step 3 — Map columns

Each column from your file is matched to a field in the app. The app recognises common synonyms and maps them automatically:

| If your column is called… | It maps to |
|--------------------------|-----------|
| Service Name, Title, Label | Name |
| Monthly Cost, Fee, Price, Charge | Amount |
| Billing Frequency, Payment Cycle | Billing interval |
| Expiry, Expiration, Renewal Date | End date |
| Notes, Description, Comments | Details |
| Website, Link, Homepage | Service URL |

Required fields are marked with a `*`. If a required field is not mapped the row will be shown in red and must be resolved before import can continue. Optional columns can be explicitly skipped.

### Step 4 — Import

The app creates a contract for each row. Rows that fail validation (e.g. invalid category value) are skipped and reported individually.

### Step 5 — Results

A summary shows how many contracts were created and how many failed, with a per-row error message for failures. Partial imports are allowed — successfully parsed rows are saved even if others fail.

### Example JSON file

```json
[
  {
    "name": "Spotify",
    "category": "SUBSCRIPTIONS",
    "amount": 9.99,
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "endDate": "2025-12-31"
  },
  {
    "name": "Car Insurance",
    "category": "INSURANCE",
    "amount": 420.00,
    "billingInterval": "YEARLY",
    "startDate": "2025-01-01",
    "endDate": "2026-01-01",
    "cancellationPeriod": { "value": 1, "unit": "MONTHS" }
  }
]
```

Valid category values: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER`

Valid billing interval values: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`

---

## 7. Exporting contracts

Click **Export** in the contract list toolbar and choose a format.

| Format | Filename | Use case |
|--------|----------|---------|
| JSON | `contracts-YYYY-MM-DD.json` | Backup, re-import, scripting |
| Excel | `contracts-YYYY-MM-DD.xlsx` | Spreadsheet editing, sharing |

The export contains all contracts including inactive ones. All fields are included. The JSON export can be fed directly back into the import wizard without any column mapping.

---

## 8. Anonymization

The anonymization feature replaces real contract names with fictional company names so you can share your screen or take screenshots without revealing what services you use.

### Global toggle

Click **Anonymization** in the contract list toolbar. The button switches between:

- **Hide Real** — anonymization is on; real names are hidden everywhere
- **Show Real** — anonymization is off; real names are displayed

The preference is saved in your browser and persists across page reloads.

### Per-contract flag

Tick the **Anonymize** checkbox when creating or editing a contract to always hide that specific contract, even when the global toggle is off. Useful for a contract you consider particularly sensitive.

### How the replacement works

Each contract is consistently mapped to the same fictional name (e.g. "Aether Dynamics", "Ironveil Corp", "Starfall Industries") based on its internal ID. The same contract always gets the same alias — the mapping never changes between sessions.

Amounts, dates, categories, and status values are always visible regardless of the anonymization setting.

---

## 9. Language

The app supports **English** and **German**. Use the `EN` / `DE` buttons in the top-right corner of any page to switch. The preference is saved in your browser.

Currency amounts and dates are formatted according to the selected locale (e.g. `€15,99` and `01.03.2025` in German).

---

## 10. Accounts & sign-in

The app now requires every visitor to sign in — each family member gets their own account, and contracts belong to the account that created them. Nobody can see or change another account's contracts, including on the dashboard, exports, and imports.

### Signing in and out

Open the app and you'll land on the sign-in page if you don't already have an active session. Enter your email and password to continue. Use the **Sign out** button in the top-right corner to end your session on this device.

If you enter the wrong password too many times in a row, the account is temporarily locked — wait a few minutes and try again with the correct password.

### The first account

The very first time the app starts on a fresh installation, it automatically creates an **administrator** account and prints its email address and a one-time password to the server log (visible with `docker compose logs` or in the terminal running the backend). Sign in with those credentials and **change the password immediately** from "My Account" (see below).

If you're upgrading from an older version of the app, this same bootstrap administrator account is created and **all of your existing contracts are automatically assigned to it** — nothing is lost, and you can then create separate accounts for other family members and, if you like, recreate or reassign contracts as needed.

### My Account

Every signed-in user can open **My Account** (link in the top-right corner) to change their own password. You'll need your current password plus a new one (at least 8 characters).

### Manage Accounts (administrators only)

Administrators see an additional **Manage Accounts** link in the top-right corner. From there you can:

- **Create** a new account — provide an email, display name, role (Administrator or Member), and an initial password that the person should change after their first sign-in
- **Archive** an account to remove someone's access (e.g. when a family member moves out). Archived accounts can no longer sign in, but their data is kept for a retention period in case you change your mind
- **Reactivate** an archived account within that retention period to restore access with all of its contracts intact
- **Promote/demote** an account between Administrator and Member roles

The app always keeps at least one active administrator — you cannot archive or demote the last remaining admin, to make sure the household never locks itself out of account management.

---

## 11. Contract fields reference

| Field | Required | Constraints | Notes |
|-------|----------|-------------|-------|
| Name | Yes | 1–200 characters | Displayed with provider logo |
| Category | Yes | Utilities, Subscriptions, Insurance, Housing, Other | Used in dashboard breakdown |
| Amount | Yes | Number ≥ 0 | In your local currency |
| Billing interval | Yes | Weekly / Monthly / Quarterly / Yearly / Lifetime | Determines monthly equivalent |
| Status | Yes | Active / Inactive | Defaults to Active |
| Start date | No | YYYY-MM-DD | For your records |
| End date | No | YYYY-MM-DD | Drives renewal and expiry alerts |
| Cancellation notice | No | Positive integer + Days/Weeks/Months/Years | Shifts the deadline shown on the dashboard |
| Service URL | No | Valid URL | Link to your account page |
| Details | No | Up to 2 000 characters | Policy numbers, account IDs, notes |
| Anonymize | No | Boolean | Per-contract privacy flag |
