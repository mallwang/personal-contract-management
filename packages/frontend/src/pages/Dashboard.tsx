import { Link } from 'react-router-dom';
import { useDashboard } from '../services/api.js';
import { SpendingOverview } from '../components/SpendingOverview.js';
import { CategoryBreakdown } from '../components/CategoryBreakdown.js';
import { UpcomingRenewals } from '../components/UpcomingRenewals.js';

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-muted-foreground]">Loading dashboard…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-destructive]">
          Failed to load dashboard data. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="dashboard mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-[--color-muted-foreground]">Your contract overview</p>
          </div>
          <Link
            to="/contracts"
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Manage Contracts
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <section aria-label="Monthly spending overview">
            <SpendingOverview totalMonthlySpending={data.totalMonthlySpending} />
          </section>

          <section aria-label="Contracts by category" className="sm:col-span-2">
            <CategoryBreakdown contractsByCategory={data.contractsByCategory} />
          </section>

          <section aria-label="Upcoming renewals" className="sm:col-span-3">
            <UpcomingRenewals upcomingRenewals={data.upcomingRenewals} />
          </section>
        </div>
      </main>
    </div>
  );
}
