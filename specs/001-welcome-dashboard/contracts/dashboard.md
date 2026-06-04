# API Contract: Dashboard

## GET /api/dashboard

Returns all data needed to render the welcome dashboard in a single response.

### Request

No parameters, no request body.

### Response — 200 OK

```typescript
interface DashboardResponse {
  totalMonthlySpending: number;
  contractsByCategory: CategorySummary[];
  upcomingRenewals: UpcomingRenewal[];
}

interface CategorySummary {
  category: Category;
  label: string;        // Human-readable display label
  count: number;        // Number of active contracts in this category
  monthlyTotal: number; // Sum of monthly amounts for active contracts in this category
}

interface UpcomingRenewal {
  id: string;           // Contract UUID
  name: string;
  category: Category;
  endDate: string;      // ISO date: "YYYY-MM-DD"
  daysRemaining: number;
}

type Category = "UTILITIES" | "SUBSCRIPTIONS" | "INSURANCE" | "HOUSING" | "OTHER";
```

### Example — contracts exist

```json
{
  "totalMonthlySpending": 1347.50,
  "contractsByCategory": [
    { "category": "HOUSING",       "label": "Housing",       "count": 1, "monthlyTotal": 1200.00 },
    { "category": "UTILITIES",     "label": "Utilities",     "count": 2, "monthlyTotal":   90.00 },
    { "category": "SUBSCRIPTIONS", "label": "Subscriptions", "count": 4, "monthlyTotal":   57.50 }
  ],
  "upcomingRenewals": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Netflix",
      "category": "SUBSCRIPTIONS",
      "endDate": "2026-06-10",
      "daysRemaining": 6
    }
  ]
}
```

### Example — no contracts

```json
{
  "totalMonthlySpending": 0,
  "contractsByCategory": [],
  "upcomingRenewals": []
}
```

### Response — 500 Internal Server Error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to load dashboard data"
}
```
