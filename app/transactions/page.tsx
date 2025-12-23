"use client";

import { TransactionsPreview } from "@/components/transactions-preview";
import type { Mapping, UploadResult } from "@/types";
import { buildRecords } from "@/utils/transactions";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import Papa, { type ParseConfig, type ParseResult } from "papaparse";
import { useMemo, useState } from "react";

// Mapping type now shared via @/types

export default function TransactionsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const required = ["date", "reference", "amount"] as const;
  const optional = ["description", "balance"] as const;

  const canUpload = useMemo(() => required.every(k => mapping[k]), [mapping]);

  const onFile = (f: File | null) => {
    setFile(f);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
  };

  const parseCsv = () => {
    if (!file) return;
    setParsing(true);
    const config: ParseConfig<Record<string, unknown>> = {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, unknown>>) => {
        const data = (results.data as any[]).filter(Boolean);
        const cols = (results.meta.fields as string[]) ?? Object.keys(data[0] ?? {});
        setHeaders(cols);
        setRows(data);
        if (results.errors && results.errors.length) {
          setError(results.errors.map(e => e.message).join(", "));
        }
        setParsing(false);
      },
    };
    // Casting to any to work around @types/papaparse overload mismatch for File inputs in strict mode
    Papa.parse(file as any, config as any);
  };

  const sample = rows.slice(0, 10);

  const upload = async () => {
    try {
      setUploading(true);
      setError(null);
      setResult(null);
      const records = buildRecords(rows, mapping);
      if (!records.length) throw new Error("No rows parsed");
      const res = await fetch("/transactions/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json: UploadResult = await res.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-xl md:text-2xl font-bold">Upload Transactions (CSV)</h1>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={e => onFile(e.target.files?.[0] ?? null)}
              className="md:w-1/2"
            />
            <Button color="primary" isDisabled={!file} isLoading={parsing} onPress={parseCsv}>
              Parse CSV
            </Button>
          </div>

          {headers.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {[...required, ...optional].map(field => (
                <div key={field} className="flex flex-col gap-2">
                  <label className="text-sm font-medium capitalize">{field}</label>
                  <Select
                    selectedKeys={new Set([mapping[field] ?? ""])}
                    onSelectionChange={keys => {
                      const v = Array.from(keys)[0] as string;
                      setMapping(m => ({ ...m, [field]: v }));
                    }}
                    placeholder="Select column"
                  >
                    {headers.map(h => (
                      <SelectItem key={h}>{h}</SelectItem>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && <TransactionsPreview headers={headers} rows={rows} mapping={mapping} limit={10} />}

          {error && <div className="text-sm text-danger">{error}</div>}
          {result && (
            <div className="text-sm text-success">
              Inserted {result.inserted} of {result.total}. Skipped {result.skipped} duplicates.
            </div>
          )}
        </CardBody>
        <CardFooter>
          <Button
            color="success"
            className="w-full"
            isDisabled={!canUpload || uploading || rows.length === 0}
            isLoading={uploading}
            onPress={upload}
          >
            Upload {rows.length ? `(${rows.length} rows)` : ""}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
