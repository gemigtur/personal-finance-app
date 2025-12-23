"use client";

import type { Mapping, TransactionRecord } from "@/types";
import { buildRecords } from "@/utils/transactions";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";

export function TransactionsPreview({
  headers,
  rows,
  mapping,
  limit = 10,
}: {
  headers: string[];
  rows: any[];
  mapping: Mapping;
  limit?: number;
}) {
  const rawSample = Array.isArray(rows) ? rows.slice(0, limit) : [];
  const outputRecords: TransactionRecord[] = buildRecords(rows, mapping).slice(0, limit);
  const outputItems = outputRecords.map((r, i) => ({ ...r, key: `${r.date}-${r.reference}-${r.amount}-${i}` }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm text-foreground-500">
          Raw CSV preview: showing {rawSample.length} of {rows.length} rows.
        </div>
        <Table aria-label="Raw CSV preview" removeWrapper isHeaderSticky>
          <TableHeader>
            {headers.map(h => (
              <TableColumn key={h}>{h}</TableColumn>
            ))}
          </TableHeader>
          <TableBody items={rawSample} emptyContent="No data">
            {(item: any) => (
              <TableRow key={JSON.stringify(item)}>
                {headers.map(h => (
                  <TableCell key={h}>{String(item?.[h] ?? "")}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-foreground-500">
          Transformed output: showing {outputRecords.length} of {rows.length} rows.
        </div>
        {/* Force remount on mapping change to avoid any internal table state keeping old rows */}
        <Table key={JSON.stringify(mapping)} aria-label="Transformed transactions preview" removeWrapper isHeaderSticky>
          <TableHeader>
            <TableColumn>Date</TableColumn>
            <TableColumn>Reference</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Balance</TableColumn>
          </TableHeader>
          <TableBody items={outputItems} emptyContent="No preview available">
            {(item: TransactionRecord & { key: string }) => (
              <TableRow key={item.key}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.reference}</TableCell>
                <TableCell>{item.description ?? ""}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                    Number(item.amount ?? 0)
                  )}
                </TableCell>
                <TableCell>
                  {item.balance == null
                    ? ""
                    : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                        Number(item.balance)
                      )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
