# Translation Key Schema

**Date**: 2026-06-05
**Branch**: `005-multilanguage-support`

This document defines the canonical set of i18n translation keys. Both `en.json` and `de.json` must contain all keys listed here. Any key present in one file but absent in the other is a contract violation (enforced by the completeness test).

---

## Namespace: `nav`

| Key | English value | Notes |
|-----|--------------|-------|
| `nav.dashboard` | `"Dashboard"` | Main nav link |
| `nav.contracts` | `"Contracts"` | Contracts nav link |
| `nav.addContract` | `"Add Contract"` | CTA button label |
| `nav.manageContracts` | `"Manage Contracts"` | Dashboard → Contracts link |
| `nav.backToDashboard` | `"← Dashboard"` | Back link in contract list |

## Namespace: `common`

| Key | English value | Notes |
|-----|--------------|-------|
| `common.loading` | `"Loading…"` | Generic loading state |
| `common.save` | `"Save"` | Default form submit label |
| `common.saving` | `"Saving…"` | Submit button while pending |
| `common.cancel` | `"Cancel"` | Form cancel button |
| `common.edit` | `"Edit"` | Table row action |
| `common.delete` | `"Delete"` | Table row action |
| `common.confirm` | `"Confirm"` | Inline delete confirmation |
| `common.noData` | `"—"` | Empty cell placeholder |

## Namespace: `status`

| Key | English value | Notes |
|-----|--------------|-------|
| `status.ACTIVE` | `"Active"` | Maps to `ContractStatus.ACTIVE` |
| `status.INACTIVE` | `"Inactive"` | Maps to `ContractStatus.INACTIVE` |

## Namespace: `category`

Keys map directly to `Category` enum values.

| Key | English value |
|-----|--------------|
| `category.UTILITIES` | `"Utilities"` |
| `category.SUBSCRIPTIONS` | `"Subscriptions"` |
| `category.INSURANCE` | `"Insurance"` |
| `category.HOUSING` | `"Housing"` |
| `category.OTHER` | `"Other"` |

## Namespace: `billingInterval`

Keys map directly to `BillingInterval` enum values.

| Key | English value |
|-----|--------------|
| `billingInterval.WEEKLY` | `"Weekly"` |
| `billingInterval.MONTHLY` | `"Monthly"` |
| `billingInterval.QUARTERLY` | `"Quarterly"` |
| `billingInterval.YEARLY` | `"Yearly"` |
| `billingInterval.LIFETIME` | `"Lifetime"` |

## Namespace: `cancellationUnit`

Keys map directly to `CancellationPeriodUnit` enum values.

| Key | English value |
|-----|--------------|
| `cancellationUnit.DAYS` | `"Days"` |
| `cancellationUnit.WEEKS` | `"Weeks"` |
| `cancellationUnit.MONTHS` | `"Months"` |

## Namespace: `dashboard`

| Key | English value | Notes |
|-----|--------------|-------|
| `dashboard.title` | `"Dashboard"` | Page heading |
| `dashboard.subtitle` | `"Your contract overview"` | Page subheading |
| `dashboard.monthlySpending` | `"Monthly Spending"` | Card title |
| `dashboard.acrossActiveContracts` | `"across all active contracts"` | Card footnote |
| `dashboard.noActiveContracts` | `"No active contracts yet."` | Empty state |
| `dashboard.byCategory` | `"By Category"` | Card title |
| `dashboard.categoryColumn` | `"Category"` | Table column header |
| `dashboard.contractsColumn` | `"Contracts"` | Table column header |
| `dashboard.monthlyTotalColumn` | `"Monthly Total"` | Table column header |
| `dashboard.noCategoryContracts` | `"No active contracts."` | Empty state |
| `dashboard.upcomingRenewals` | `"Upcoming Renewals"` | Card title |
| `dashboard.noRenewals` | `"No renewals due soon."` | Empty state |
| `dashboard.daysRemaining` | `"{{count}} days remaining"` | Interpolated; `count` = number of days |
| `dashboard.loadError` | `"Failed to load dashboard data. Please refresh the page."` | Error state |

## Namespace: `contractList`

| Key | English value | Notes |
|-----|--------------|-------|
| `contractList.title` | `"Contracts"` | Page heading |
| `contractList.noContracts` | `"No contracts yet. Add your first contract above."` | Empty state |
| `contractList.nameColumn` | `"Name"` | Table header |
| `contractList.categoryColumn` | `"Category"` | Table header |
| `contractList.amountColumn` | `"Amount / Interval"` | Table header |
| `contractList.statusColumn` | `"Status"` | Table header |
| `contractList.endDateColumn` | `"End Date"` | Table header |
| `contractList.actionsColumn` | `"Actions"` | Table header |
| `contractList.deleteError` | `"Failed to delete contract. Please try again."` | Error banner |
| `contractList.loadError` | `"Failed to load contracts."` | Error state |

## Namespace: `contractForm`

| Key | English value | Notes |
|-----|--------------|-------|
| `contractForm.nameLabel` | `"Name *"` | Field label |
| `contractForm.namePlaceholder` | `"e.g. Netflix"` | Input placeholder |
| `contractForm.categoryLabel` | `"Category *"` | Field label |
| `contractForm.amountLabel` | `"Amount *"` | Field label |
| `contractForm.billingIntervalLabel` | `"Billing Interval *"` | Field label |
| `contractForm.statusLabel` | `"Status *"` | Field label |
| `contractForm.endDateLabel` | `"End Date"` | Field label |
| `contractForm.startDateLabel` | `"Start Date"` | Field label |
| `contractForm.detailsLabel` | `"Details"` | Field label |
| `contractForm.detailsPlaceholder` | `"Additional notes about this contract"` | Textarea placeholder |
| `contractForm.serviceUrlLabel` | `"Service URL"` | Field label |
| `contractForm.serviceUrlPlaceholder` | `"https://example.com"` | Input placeholder |
| `contractForm.cancellationPeriodLabel` | `"Cancellation Period"` | Field label |
| `contractForm.cancellationUnitAriaLabel` | `"Cancellation Unit"` | Aria label for unit select |
| `contractForm.nameRequired` | `"Name is required."` | Validation error |
| `contractForm.amountInvalid` | `"Amount must be a non-negative number."` | Validation error |

## Namespace: `contractNew`

| Key | English value | Notes |
|-----|--------------|-------|
| `contractNew.title` | `"Add Contract"` | Page heading |

## Namespace: `contractEdit`

| Key | English value | Notes |
|-----|--------------|-------|
| `contractEdit.title` | `"Edit Contract"` | Page heading |
| `contractEdit.loadError` | `"Failed to load contracts."` | Error state |
| `contractEdit.notFound` | `"Contract not found."` | Error state |

---

## Key Count Summary

| Namespace | Keys |
|-----------|------|
| `nav` | 5 |
| `common` | 8 |
| `status` | 2 |
| `category` | 5 |
| `billingInterval` | 5 |
| `cancellationUnit` | 3 |
| `dashboard` | 14 |
| `contractList` | 10 |
| `contractForm` | 16 |
| `contractNew` | 1 |
| `contractEdit` | 3 |
| **Total** | **72** |

---

## TypeScript Type Declaration

The i18n module exports a typed resource declaration so that `t('invalid.key')` fails at compile time:

```typescript
// packages/frontend/src/i18n/types.d.ts
import en from './locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
```

This ensures the compiler catches any typo in translation key references across all component files.
