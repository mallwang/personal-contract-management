# Data Model: Contract Icon Visuals

## Summary

No new persistent data entities. Both icons are **derived/ephemeral** from existing contract fields.

---

## Derived Visual Attributes on `Contract`

The existing `Contract` type in `packages/shared/src/types/contract.ts` already provides all inputs needed:

| Existing field  | Used for            | Notes                                                      |
|-----------------|---------------------|------------------------------------------------------------|
| `category`      | Category icon       | Maps directly to a Lucide icon via static map              |
| `name`          | Provider logo       | Passed directly to logo.dev `/name/` endpoint              |
| `anonymize`     | Logo suppression    | Forces fallback icon when `true`; name never sent to API   |

**No changes to the `Contract` type or database schema are required.**
**`serviceUrl` is no longer used for logo resolution** — logo.dev accepts company names directly.

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

At render time, the logo URL is constructed directly from the contract name:

```
logoUrl(name: string, isAnonymized: boolean): string | null

Algorithm:
  if isAnonymized → return null
  if name is empty → return null
  return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${LOGO_DEV_PUBLIC_TOKEN}`
```

logo.dev returns a branded placeholder for unrecognised names, so no domain-resolution step is needed. React `<img onError>` still switches to the Lucide `Building2` fallback on full network failure.

**No persistence**. The URL is computed each render.

---

## Anonymization Guard

When `ProviderLogo` is rendered in an anonymized context (`isAnonymized` prop `true` OR `contract.anonymize === true`), `logoUrl` must return `null` so only the fallback icon is shown and the contract name is never sent to the logo.dev API.

---

## No Schema Changes

- `packages/shared/src/schemas/contract.ts` — unchanged
- `packages/shared/src/types/contract.ts` — unchanged
- Backend database — unchanged
