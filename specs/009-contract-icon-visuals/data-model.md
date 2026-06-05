# Data Model: Contract Icon Visuals

## Summary

No new persistent data entities. Both icons are **derived/ephemeral** from existing contract fields.

---

## Derived Visual Attributes on `Contract`

The existing `Contract` type in `packages/shared/src/types/contract.ts` already provides all inputs needed:

| Existing field  | Used for            | Notes                                          |
|-----------------|---------------------|------------------------------------------------|
| `category`      | Category icon       | Maps directly to a Lucide icon via static map  |
| `serviceUrl`    | Provider logo (T1)  | Domain extracted via URL parse                 |
| `name`          | Provider logo (T2)  | First-word heuristic domain fallback           |
| `anonymize`     | Logo suppression    | Forces fallback icon when `true`               |

**No changes to the `Contract` type or database schema are required.**

---

## CategoryIconMap (static frontend constant)

A compile-time constant mapping each `Category` enum value to a Lucide icon component.

```
CategoryIconMap: Record<Category | 'DEFAULT', LucideIcon>

Entries:
  UTILITIES     → Zap
  SUBSCRIPTIONS → Play
  INSURANCE     → Shield
  HOUSING       → Home
  OTHER         → FileText
  DEFAULT       → FileText   (catches any future unrecognised category value)
```

**Location**: `packages/frontend/src/components/CategoryIcon.tsx`
**Type**: No shared type needed — purely a frontend rendering concern.

---

## ProviderLogoResolution (runtime derived value, not stored)

At render time, a domain string is resolved from the contract and passed to the logo URL:

```
resolveDomain(contract: ContractData): string | null

Algorithm:
  1. If contract.serviceUrl is set and parseable as URL → return hostname stripped of "www."
  2. Else if contract.name is set → return first word, lowercased + ".com"
  3. Else → return null

logoUrl(domain: string): string
  → "https://icons.duckduckgo.com/ip3/{domain}.ico"
```

**No persistence**. The resolved domain and logo URL are computed each render.

---

## Anonymization Guard

When `ProviderLogo` is rendered in an anonymized context (`isAnonymized` prop `true` OR `contract.anonymize === true`), `resolveDomain` must return `null` so only the fallback icon is shown.

---

## No Schema Changes

- `packages/shared/src/schemas/contract.ts` — unchanged
- `packages/shared/src/types/contract.ts` — unchanged
- Backend database — unchanged
