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

**Decision**: Use the **DuckDuckGo Favicon Service** as the primary logo/icon source.

URL pattern: `https://icons.duckduckgo.com/ip3/{domain}.ico`

**Rationale**:
- Free with no API key or account required
- Privacy-friendly (suitable for a personal-use app)
- Returns a 404 or empty response for unknown domains, which `<img onError>` handles cleanly
- No rate limits for personal-use volume
- Cached by DuckDuckGo CDN

**Alternatives considered**:

| Service                       | Quality   | Auth needed | Privacy   | Decision       |
|-------------------------------|-----------|-------------|-----------|----------------|
| DuckDuckGo Favicon            | Favicon   | No          | Good      | **Selected**   |
| Google Favicon API            | Good      | No          | Poor      | Rejected       |
| Clearbit Logo API             | Excellent | No (free)   | Neutral   | Backup option  |
| Manual brand asset hosting    | Perfect   | N/A         | Perfect   | Too much work  |

**Note**: Clearbit (`https://logo.clearbit.com/{domain}`) produces higher-quality logos but has informal rate limits. Either service can be swapped in as the `src` URL since the fallback mechanism is service-agnostic.

---

## 3. Provider Domain Resolution

**Decision**: Two-tier resolution from existing contract data fields — no new data field required.

**Tier 1 — `serviceUrl` (reliable)**:
Extract the hostname from the existing `serviceUrl` field via the browser-native `URL` constructor.
Example: `https://www.netflix.com/plans` → `netflix.com`

**Tier 2 — Name heuristic (best-effort)**:
Take the first word of the contract name, lowercase it, append `.com`.
Example: `"Netflix Subscription"` → `netflix.com`

**Final fallback**:
If neither tier yields a usable domain, or if the logo `<img>` fails to load, render Lucide `Building2` icon.

**Rationale**:
- `serviceUrl` is already present on the `Contract` type and is the most reliable source
- The name heuristic covers the common personal-contract case where users name contracts after the provider (e.g., "Spotify", "ADAC", "Amazon Prime")
- No new data field, no backend changes — fully YAGNI-compliant

**Known limitations**:
- German compound provider names (e.g., "Stadtwerke München") won't resolve to a logo; fallback covers this cleanly
- Non-`.com` TLDs not guessed by the heuristic (e.g., `bbc.co.uk`) — `serviceUrl` must be set for those

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
