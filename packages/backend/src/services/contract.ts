import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { ContractData, CreateContractBody, UpdateContractBody } from '@pcm/shared';
import type { ContractRow } from '../db/client.js';

function rowToContract(row: ContractRow): ContractData {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ContractData['category'],
    amount: row.amount,
    billingInterval: row.billing_interval as ContractData['billingInterval'],
    status: row.status as ContractData['status'],
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ContractService {
  constructor(private readonly db: Database.Database) {}

  list(): ContractData[] {
    const rows = this.db
      .prepare<[], ContractRow>(`SELECT * FROM contracts ORDER BY name ASC`)
      .all();
    return rows.map(rowToContract);
  }

  create(body: CreateContractBody): ContractData {
    const now = new Date().toISOString();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
         VALUES (@id, @name, @category, @amount, @billing_interval, @status, @end_date, @created_at, @updated_at)`,
      )
      .run({
        id,
        name: body.name,
        category: body.category,
        amount: body.amount,
        billing_interval: body.billingInterval,
        status: body.status ?? 'ACTIVE',
        end_date: body.endDate ?? null,
        created_at: now,
        updated_at: now,
      });
    const row = this.db
      .prepare<[string], ContractRow>(`SELECT * FROM contracts WHERE id = ?`)
      .get(id)!;
    return rowToContract(row);
  }

  update(id: string, body: UpdateContractBody): ContractData | null {
    const existing = this.db
      .prepare<[string], ContractRow>(`SELECT * FROM contracts WHERE id = ?`)
      .get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: ContractRow = {
      ...existing,
      name: body.name ?? existing.name,
      category: body.category ?? existing.category,
      amount: body.amount ?? existing.amount,
      billing_interval: body.billingInterval ?? existing.billing_interval,
      status: body.status ?? existing.status,
      end_date: body.endDate !== undefined ? (body.endDate ?? null) : existing.end_date,
      updated_at: now,
    };
    this.db
      .prepare(
        `UPDATE contracts
         SET name = @name, category = @category, amount = @amount,
             billing_interval = @billing_interval, status = @status,
             end_date = @end_date, updated_at = @updated_at
         WHERE id = @id`,
      )
      .run(updated);
    return rowToContract(updated);
  }

  delete(id: string): boolean {
    const result = this.db.prepare(`DELETE FROM contracts WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}
