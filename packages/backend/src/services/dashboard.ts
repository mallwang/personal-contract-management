import type Database from 'better-sqlite3';
import type {
  DashboardResponse,
  CategorySummary,
  UpcomingRenewal,
  ExpiredContract,
} from '@pcm/shared';
import { CATEGORY_LABELS, type Category, type CancellationPeriodUnit } from '@pcm/shared';

const GRACE_PERIOD_DAYS = 30;

function computeCancellationDeadline(
  endDate: Date,
  period: { value: number; unit: CancellationPeriodUnit } | null,
): Date {
  if (!period) return new Date(endDate);
  const result = new Date(endDate);
  switch (period.unit) {
    case 'DAYS':
      result.setUTCDate(result.getUTCDate() - period.value);
      break;
    case 'WEEKS':
      result.setUTCDate(result.getUTCDate() - period.value * 7);
      break;
    case 'MONTHS':
      result.setUTCMonth(result.getUTCMonth() - period.value);
      break;
    case 'YEARS':
      result.setUTCFullYear(result.getUTCFullYear() - period.value);
      break;
  }
  return result;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MONTHLY_FACTOR_SQL = `
  amount * CASE billing_interval
    WHEN 'WEEKLY'    THEN 52.0/12.0
    WHEN 'MONTHLY'   THEN 1.0
    WHEN 'QUARTERLY' THEN 1.0/3.0
    WHEN 'YEARLY'    THEN 1.0/12.0
    ELSE 0.0
  END
`.trim();

export class DashboardService {
  constructor(private readonly db: Database.Database) {}

  getDashboardData(ownerId: string): DashboardResponse {
    const totalMonthlySpending = this.getTotalMonthlySpending(ownerId);
    const contractsByCategory = this.getContractsByCategory(ownerId);
    const upcomingRenewals = this.getUpcomingRenewals(ownerId);
    const expiredContracts = this.getExpiredContracts(ownerId);
    return { totalMonthlySpending, contractsByCategory, upcomingRenewals, expiredContracts };
  }

  private getTotalMonthlySpending(ownerId: string): number {
    const row = this.db
      .prepare<[string], { total: number }>(
        `SELECT COALESCE(SUM(${MONTHLY_FACTOR_SQL}), 0) AS total
         FROM contracts
         WHERE status = 'ACTIVE' AND user_id = ?`,
      )
      .get(ownerId);
    return row?.total ?? 0;
  }

  private getContractsByCategory(ownerId: string): CategorySummary[] {
    const rows = this.db
      .prepare<[string], { category: string; count: number; monthly_total: number }>(
        `SELECT category,
                COUNT(*) AS count,
                SUM(${MONTHLY_FACTOR_SQL}) AS monthly_total
         FROM contracts
         WHERE status = 'ACTIVE' AND user_id = ?
         GROUP BY category
         ORDER BY monthly_total DESC`,
      )
      .all(ownerId);

    return rows.map((row) => ({
      category: row.category as Category,
      label: CATEGORY_LABELS[row.category as Category] ?? row.category,
      count: row.count,
      monthlyTotal: row.monthly_total,
    }));
  }

  private getUpcomingRenewals(ownerId: string): UpcomingRenewal[] {
    const rows = this.db
      .prepare<
        [string],
        {
          id: string;
          name: string;
          category: string;
          end_date: string;
          cancellation_period_value: number | null;
          cancellation_period_unit: string | null;
          anonymize: number;
        }
      >(
        `SELECT id, name, category, end_date,
                cancellation_period_value, cancellation_period_unit, anonymize
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date >= DATE('now')
           AND user_id = ?`,
      )
      .all(ownerId);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const results: UpcomingRenewal[] = [];

    for (const row of rows) {
      // Parse date-only strings as UTC midnight to avoid local-timezone shifts
      const endDate = new Date(row.end_date + 'T00:00:00Z');

      const period =
        row.cancellation_period_value !== null && row.cancellation_period_unit !== null
          ? {
              value: row.cancellation_period_value,
              unit: row.cancellation_period_unit as CancellationPeriodUnit,
            }
          : null;

      const cancellationDeadline = computeCancellationDeadline(endDate, period);

      const panelEntryDate = new Date(cancellationDeadline);
      panelEntryDate.setUTCDate(panelEntryDate.getUTCDate() - GRACE_PERIOD_DAYS);

      if (today < panelEntryDate) continue;

      const daysUntilCancellationDeadline = Math.round(
        (cancellationDeadline.getTime() - today.getTime()) / 86_400_000,
      );

      results.push({
        id: row.id,
        name: row.name,
        category: row.category as Category,
        endDate: row.end_date,
        cancellationDeadline: toDateString(cancellationDeadline),
        daysUntilCancellationDeadline,
        anonymize: row.anonymize !== 0,
      });
    }

    results.sort((a, b) => {
      if (a.daysUntilCancellationDeadline !== b.daysUntilCancellationDeadline) {
        return a.daysUntilCancellationDeadline - b.daysUntilCancellationDeadline;
      }
      return a.name.localeCompare(b.name);
    });

    return results;
  }

  private getExpiredContracts(ownerId: string): ExpiredContract[] {
    const rows = this.db
      .prepare<
        [string],
        { id: string; name: string; category: string; end_date: string; anonymize: number }
      >(
        `SELECT id, name, category, end_date, anonymize
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date < DATE('now')
           AND user_id = ?
         ORDER BY end_date DESC`,
      )
      .all(ownerId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.map((row) => {
      const end = new Date(row.end_date);
      end.setHours(0, 0, 0, 0);
      const daysOverdue = Math.round((today.getTime() - end.getTime()) / 86_400_000);
      return {
        id: row.id,
        name: row.name,
        category: row.category as Category,
        endDate: row.end_date,
        daysOverdue,
        anonymize: row.anonymize !== 0,
      };
    });
  }
}
