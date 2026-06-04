import type Database from 'better-sqlite3';
import type { DashboardResponse, CategorySummary, UpcomingRenewal } from '@pcm/shared';
import { CATEGORY_LABELS, type Category } from '@pcm/shared';

export class DashboardService {
  constructor(private readonly db: Database.Database) {}

  getDashboardData(): DashboardResponse {
    const totalMonthlySpending = this.getTotalMonthlySpending();
    const contractsByCategory = this.getContractsByCategory();
    const upcomingRenewals = this.getUpcomingRenewals();
    return { totalMonthlySpending, contractsByCategory, upcomingRenewals };
  }

  private getTotalMonthlySpending(): number {
    const row = this.db
      .prepare<[], { total: number }>(
        `SELECT COALESCE(SUM(monthly_amount), 0) AS total
         FROM contracts
         WHERE status = 'ACTIVE'`,
      )
      .get();
    return row?.total ?? 0;
  }

  private getContractsByCategory(): CategorySummary[] {
    const rows = this.db
      .prepare<
        [],
        { category: string; count: number; monthly_total: number }
      >(
        `SELECT category,
                COUNT(*) AS count,
                SUM(monthly_amount) AS monthly_total
         FROM contracts
         WHERE status = 'ACTIVE'
         GROUP BY category
         ORDER BY monthly_total DESC`,
      )
      .all();

    return rows.map((row) => ({
      category: row.category as Category,
      label: CATEGORY_LABELS[row.category as Category] ?? row.category,
      count: row.count,
      monthlyTotal: row.monthly_total,
    }));
  }

  private getUpcomingRenewals(): UpcomingRenewal[] {
    const rows = this.db
      .prepare<
        [],
        { id: string; name: string; category: string; end_date: string }
      >(
        `SELECT id, name, category, end_date
         FROM contracts
         WHERE end_date IS NOT NULL
           AND end_date >= DATE('now')
           AND end_date <= DATE('now', '+30 days')
         ORDER BY end_date ASC`,
      )
      .all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.map((row) => {
      const end = new Date(row.end_date);
      end.setHours(0, 0, 0, 0);
      const daysRemaining = Math.round((end.getTime() - today.getTime()) / 86_400_000);
      return {
        id: row.id,
        name: row.name,
        category: row.category as Category,
        endDate: row.end_date,
        daysRemaining,
      };
    });
  }
}
