"use client";

import type { AmountTableProps } from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tooltip } from "@heroui/react";
import type { FC } from "react";
import { HiArrowDownRight, HiArrowUpRight } from "react-icons/hi2";
import useSWR from "swr";
import { LineChartRender } from "./line-charts";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface StatCardProps {
  grouped: boolean;
  percentage: boolean;
}
export const StatCard: FC<StatCardProps> = ({ grouped, percentage }) => {
  const url = `/amount/api?order=asc&grouped=${grouped}&percentage=${percentage}`;
  const { data, error, isLoading: loading } = useSWR(url, fetcher);

  if (error) return <p>error..</p>;

  if (loading) return <p>loading..</p>;

  const accounts = new Set<string>(data.data.map((d: AmountTableProps) => d.account_name));
  const current_amounts = [...accounts].map(name => {
    const rows = data.data.filter((r: any) => name === r.account_name);
    const amounts = rows.map((r: any) => r.amount as number);
    const dates = rows.map((r: any) => String(r.date).split("T")[0]);
    const last = amounts[amounts.length - 1] ?? 0;
    const prev = amounts[amounts.length - 2] ?? 0;
    const lastDate = dates[dates.length - 1] ?? "";
    const prevDate = dates[dates.length - 2] ?? "";
    const pct = amounts.length > 1 && prev !== 0 ? ((last - prev) / prev) * 100 : 0;
    const diff = last - prev;
    return { name, value: last, percentage: pct, lastDate, prevDate, prev, diff };
  });
  return (
    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
      {current_amounts.map(current => {
        const up = current.percentage >= 0;
        return (
          <Card key={current.name} className="w-full">
            <CardHeader className="justify-between items-center">
              <span className="text-base font-semibold tracking-tight">{current.name}</span>
              <Tooltip
                placement="left"
                content={
                  <div className="text-xs">
                    <div>
                      <span className="font-medium">Current</span> ({current.lastDate}):{" "}
                      {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(current.value)}
                    </div>
                    <div>
                      <span className="font-medium">Previous</span> ({current.prevDate || "n/a"}):{" "}
                      {current.prev
                        ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(current.prev)
                        : "n/a"}
                    </div>
                    <div>
                      <span className="font-medium">Change</span>: {up ? "+" : ""}
                      {current.percentage.toFixed(1)}% (
                      {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(current.diff)})
                    </div>
                  </div>
                }
              >
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
                    up ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  {up ? <HiArrowUpRight /> : <HiArrowDownRight />}
                  {up ? "+" : ""}
                  {current.percentage.toFixed(1)}%
                </span>
              </Tooltip>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <p className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(current.value)}
              </p>
              <LineChartRender grouped={false} percentage={true} account={current.name} isCompact={true} />
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};
