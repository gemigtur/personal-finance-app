"use client";

// import the core library.
import ReactEChartsCore from "echarts-for-react/lib/core";
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import { Tooltip } from "@heroui/react";
import { CanvasRenderer } from "echarts/renderers";
import type { FC } from "react";
import { HiArrowDownRight, HiArrowUpRight } from "react-icons/hi2";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface LineChartProps {
  grouped: boolean;
  percentage: boolean;
  account?: String;
  isCompact?: boolean;
  showTotal?: boolean;
  showBadge?: boolean;
}

export const LineChartRender: FC<LineChartProps> = ({
  grouped,
  percentage,
  account,
  isCompact,
  showTotal,
  showBadge,
}) => {
  // Register the required components
  echarts.use([TitleComponent, TooltipComponent, GridComponent, LineChart, CanvasRenderer, LegendComponent]);
  const url = `/amount/api?order=asc&grouped=${grouped}&percentage=${percentage}`;
  const { data, error, isLoading: loading } = useSWR(url, fetcher);

  if (error) return <p>error..</p>;

  if (loading) return <p>loading..</p>;

  const x = data ? [...new Set(data.data.map((d: any) => d.date.split("T")[0]))] : [];
  // const y = data ? data.data.map((d: any) => d.amount) : [];
  const accounts = new Set(data.data.map((d: any) => d.account_name));

  if (account) {
    accounts.clear();
    accounts.add(account);
  }

  const series = [...accounts].map(a => {
    return {
      type: "line",
      name: a,
      smooth: true,
      showSymbol: false,
      // areaStyle: {
      //   opacity: 0.5,
      // },

      data: data.data.filter((r: any) => a === r.account_name).map((r: any) => r.amount),
    };
  });

  const option = {
    legend: {
      data: [...accounts],
    },
    axisPointer: {
      show: true,
      type: "line",
    },
    xAxis: {
      type: "category",
      data: x,
    },
    yAxis: {
      type: "value",
      splitLine: {
        show: false,
      },
    },
    tooltip: {
      show: true,
    },
    series: series,
  };

  const compactOption = {
    series: series,
    xAxis: {
      type: "category",
      data: x,
      show: false,
    },
    yAxis: {
      type: "value",
      show: false,
      splitLine: {
        show: false,
      },
    },
  };

  // Compute overall percentage delta for the primary series when enabled
  let deltaBadge: JSX.Element | null = null;
  const shouldShowBadge = (showBadge ?? percentage) && !isCompact;
  if (shouldShowBadge) {
    const names = [...accounts];
    const focus = account ? String(account) : names[0];
    const rows = data.data.filter((r: any) => r.account_name === focus);
    const values = rows.map((r: any) => Number(r.amount));
    const dates = rows.map((r: any) => String(r.date).split("T")[0]);
    const last = values[values.length - 1] ?? 0;
    const prev = values[values.length - 2] ?? 0;
    const lastDate = dates[dates.length - 1] ?? "";
    const prevDate = dates[dates.length - 2] ?? "";
    const pct = prev !== 0 ? ((last - prev) / prev) * 100 : 0;
    const up = pct >= 0;
    const diff = last - prev;
    const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

    deltaBadge = (
      <Tooltip
        placement="left"
        content={
          <div className="text-xs">
            <div>
              <span className="font-medium">Current</span> ({lastDate}): {fmt.format(last)}
            </div>
            <div>
              <span className="font-medium">Previous</span> ({prevDate || "n/a"}): {prev ? fmt.format(prev) : "n/a"}
            </div>
            <div>
              <span className="font-medium">Change</span>: {up ? "+" : ""}
              {pct.toFixed(1)}% ({fmt.format(diff)})
            </div>
          </div>
        }
      >
        <span
          className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
            up ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
          }`}
        >
          {up ? <HiArrowUpRight /> : <HiArrowDownRight />}
          {up ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      </Tooltip>
    );
  }

  // Optional total block above chart for main chart
  let totalBlock: JSX.Element | null = null;
  if (showTotal && !isCompact) {
    const names = [...accounts];
    const focus = account ? String(account) : names[0];
    const rows = data.data.filter((r: any) => r.account_name === focus);
    const values = rows.map((r: any) => Number(r.amount));
    const last = values[values.length - 1] ?? 0;
    const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
    totalBlock = (
      <div className="mb-2">
        <span className="text-xs uppercase text-foreground-500">Total</span>
        <div className="text-2xl md:text-3xl font-extrabold tracking-tight">{fmt.format(last)}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {totalBlock}
      {deltaBadge}
      <ReactEChartsCore
        echarts={echarts}
        option={isCompact ? compactOption : option}
        notMerge={true}
        lazyUpdate={true}
        theme={"theme_name"}
      />
    </div>
  );
};
