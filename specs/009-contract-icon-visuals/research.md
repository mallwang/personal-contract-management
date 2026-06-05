# Research: Contract Icon Visuals

## 1. Category Icon Library

**Decision**: Use [Lucide React](https://lucide.dev/) icons already installed in the frontend (`lucide-react: ^1.17.0`).

**Rationale**: No additional dependency needed. Lucide has suitable icons for all five contract categories.

**Alternatives considered**:
- Heroicons: would require a new dependency
- Custom SVGs: more maintenance burden with no benefit
- React Icons: heavier bundle, also unnecessary given Lucide is already present

**Mapping**:

| Category       | Lucide Icon   | Visual rationale                  |
|----------------|---------------|-----------------------------------|
| UTILITIES      | `Zap`         | Energy / electricity              |
| SUBSCRIPTIONS  | `Play`        | Streaming / media services        |
| INSURANCE      | `Shield`      | Protection / coverage             |
| HOUSING        | `Home`        | Housing / real estate             |
| OTHER          | `FileText`    | Generic contract / document       |
| *(fallback)*   | `FileText`    | Default for unmapped categories   |

---

## 2. Provider Logo Fetching Service

**Decision**: Use **[logo.dev](https://www.logo.dev)** with the `/name/` endpoint.

URL pattern: `https://img.logo.dev/name/{name}?token={LOGO_DEV_PUBLIC_TOKEN}`

**Rationale**:
- User already has an account with a provisioned public token
- The `/name/` endpoint accepts a company name directly — no domain resolution step required
- logo.dev handles unknown-company fallback natively (returns a placeholder, not a 404), eliminating the need for a React-level fallback for unknown providers
- High-quality brand logos, not just favicons
- React `<img onError>` still covers complete network failure

**Token**: `pk_dTJBcEKxQgCQUZhio2o9Vw` (public key, safe to include in frontend bundle; store as `VITE_LOGO_DEV_TOKEN` in `.env`)

**Alternatives considered and superseded**:

| Service                  | Quality   | Auth needed | Name lookup | Decision              |
|--------------------------|-----------|-------------|-------------|-----------------------|
| logo.dev `/name/`        | Excellent | Public token | Direct      | **Selected** (user account) |
| DuckDuckGo Favicon       | Favicon   | No          | Domain only | Superseded            |
| Google Favicon API       | Good      | No          | Domain only | Superseded            |
| Clearbit Logo API        | Excellent | No (free)   | Domain only | Superseded            |

---

## 3. Provider Name Lookup

**Decision**: Pass the contract `name` field directly to logo.dev's `/name/` endpoint — no domain resolution required.

URL: `https://img.logo.dev/name/{encodeURIComponent(contract.name)}?token={LOGO_DEV_PUBLIC_TOKEN}`

logo.dev's name search handles multi-word names (e.g., "Amazon Prime") and returns a graceful placeholder for unrecognised names. This replaces the former two-tier domain heuristic entirely.

**Anonymization guard**: when a contract is anonymized, pass `null` as the name so only the Lucide `Building2` fallback is shown (see §5).

**React-level fallback**: `<img onError>` → render Lucide `Building2` — covers the case where the device is fully offline or logo.dev is unreachable.

---

## 4. Implementation Boundaries

| Area            | In scope                                              | Out of scope                               |
|-----------------|-------------------------------------------------------|--------------------------------------------|
| Frontend        | CategoryIcon, ProviderLogo components; update ContractTable + ContractForm | Dashboard cards, SpendingOverview          |
| Backend         | No changes                                            | Logo caching, proxy endpoint               |
| Shared types    | No changes                                            | New contract fields                        |
| i18n            | No new strings needed (icons are visual)              | Logo alt-text localisation                 |
| Anonymization   | Provider logo hidden when contract is anonymized      | —                                          |

---

## 5. Anonymization Interaction

The contract `anonymize` flag and the app-level anonymization toggle already affect the `name` field display in `ContractTable`. Since provider logos are derived from either `serviceUrl` or the contract name, they reveal provider identity even when the name is anonymized. Therefore:

**Decision**: When a contract is displayed in anonymized mode (either `contract.anonymize === true` or the global anonymization toggle is active), the `ProviderLogo` component must render only the fallback icon, not the resolved logo.

This preserves the existing anonymization guarantee without leaking identity through logos.
