# Interface Contracts: Contract Icon Visuals

This feature introduces **no new API endpoints or shared type contracts**.

All changes are confined to the frontend rendering layer:

- `CategoryIcon` and `ProviderLogo` are internal React components
- No new routes are added to the backend
- No changes to `@pcm/shared` types or schemas
- External logo fetching is done via browser `<img>` tags pointing to the DuckDuckGo Favicon API — no custom fetch wrapper or service contract needed

## Component Props (frontend-internal contracts)

### `CategoryIcon`

```ts
interface CategoryIconProps {
  category: Category;        // from @pcm/shared
  className?: string;        // Tailwind/CSS classes for sizing and colour
}
```

### `ProviderLogo`

```ts
interface ProviderLogoProps {
  serviceUrl: string | null;  // from contract.serviceUrl
  name: string;               // from contract.name (fallback domain heuristic)
  isAnonymized?: boolean;     // suppress logo when true; defaults to false
  className?: string;
  size?: number;              // icon size in px; defaults to 24
}
```

These props are not shared across packages and do not require a contract file beyond this note.
