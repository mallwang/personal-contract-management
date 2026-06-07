import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type {
  ContractData,
  CreateContractBody,
  UpdateContractBody,
  CancellationPeriodUnit,
} from '@pcm/shared';
import type { ContractRow } from '../db/client.js';

function rowToContract(row: ContractRow): ContractData {
  const cancellationPeriod =
    row.cancellation_period_value !== null && row.cancellation_period_unit !== null
      ? {
          value: row.cancellation_period_value,
          unit: row.cancellation_period_unit as CancellationPeriodUnit,
        }
      : null;

  return {
    id: row.id,
    name: row.name,
    category: row.category as ContractData['category'],
    amount: row.amount,
    billingInterval: row.billing_interval as ContractData['billingInterval'],
    status: row.status as ContractData['status'],
    endDate: row.end_date,
    startDate: row.start_date,
    details: row.details,
    serviceUrl: row.service_url,
    cancellationPeriod,
    anonymize: row.anonymize !== 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ContractService {
  constructor(private readonly db: Database.Database) {}

  list(ownerId: string): ContractData[] {
    const rows = this.db
      .prepare<[string], ContractRow>(`SELECT * FROM contracts WHERE user_id = ? ORDER BY name ASC`)
      .all(ownerId);
    return rows.map(rowToContract);
  }

  create(body: CreateContractBody, ownerId: string): ContractData {
    const now = new Date().toISOString();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO contracts (id, user_id, name, category, amount, billing_interval, status, end_date,
                                start_date, details, service_url,
                                cancellation_period_value, cancellation_period_unit,
                                anonymize, created_at, updated_at)
         VALUES (@id, @user_id, @name, @category, @amount, @billing_interval, @status, @end_date,
                 @start_date, @details, @service_url,
                 @cancellation_period_value, @cancellation_period_unit,
                 @anonymize, @created_at, @updated_at)`,
      )
      .run({
        id,
        user_id: ownerId,
        name: body.name,
        category: body.category,
        amount: body.amount,
        billing_interval: body.billingInterval,
        status: body.status ?? 'ACTIVE',
        end_date: body.endDate ?? null,
        start_date: body.startDate ?? null,
        details: body.details ?? null,
        service_url: body.serviceUrl ?? null,
        cancellation_period_value: body.cancellationPeriod?.value ?? null,
        cancellation_period_unit: body.cancellationPeriod?.unit ?? null,
        anonymize: body.anonymize ? 1 : 0,
        created_at: now,
        updated_at: now,
      });
    const row = this.db
      .prepare<[string], ContractRow>(`SELECT * FROM contracts WHERE id = ?`)
      .get(id)!;
    return rowToContract(row);
  }

  update(id: string, body: UpdateContractBody, ownerId: string): ContractData | null {
    const existing = this.db
      .prepare<
        [string, string],
        ContractRow
      >(`SELECT * FROM contracts WHERE id = ? AND user_id = ?`)
      .get(id, ownerId);
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
      start_date: body.startDate !== undefined ? (body.startDate ?? null) : existing.start_date,
      details: body.details !== undefined ? (body.details ?? null) : existing.details,
      service_url: body.serviceUrl !== undefined ? (body.serviceUrl ?? null) : existing.service_url,
      cancellation_period_value:
        body.cancellationPeriod !== undefined
          ? (body.cancellationPeriod?.value ?? null)
          : existing.cancellation_period_value,
      cancellation_period_unit:
        body.cancellationPeriod !== undefined
          ? (body.cancellationPeriod?.unit ?? null)
          : existing.cancellation_period_unit,
      anonymize: body.anonymize !== undefined ? (body.anonymize ? 1 : 0) : existing.anonymize,
      updated_at: now,
    };
    this.db
      .prepare(
        `UPDATE contracts
         SET name = @name, category = @category, amount = @amount,
             billing_interval = @billing_interval, status = @status,
             end_date = @end_date,
             start_date = @start_date, details = @details, service_url = @service_url,
             cancellation_period_value = @cancellation_period_value,
             cancellation_period_unit = @cancellation_period_unit,
             anonymize = @anonymize,
             updated_at = @updated_at
         WHERE id = @id`,
      )
      .run(updated);
    return rowToContract(updated);
  }

  delete(id: string, ownerId: string): boolean {
    const result = this.db
      .prepare(`DELETE FROM contracts WHERE id = ? AND user_id = ?`)
      .run(id, ownerId);
    return result.changes > 0;
  }
}
