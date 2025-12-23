import type { Mapping, TransactionRecord } from "@/types";

export function buildRecords(rows: any[], mapping: Mapping): TransactionRecord[] {
  if (!rows?.length) return [];
  const get = (row: any, key?: string) => (key ? row?.[key] : undefined);
  return rows.map(row => ({
    date: String(get(row, mapping.date) ?? "").split("T")[0],
    reference: String(get(row, mapping.reference) ?? ""),
    description: get(row, mapping.description)?.toString() ?? null,
    amount: Number(get(row, mapping.amount) ?? 0),
    balance: get(row, mapping.balance) == null ? null : Number(get(row, mapping.balance)),
  }));
}
