"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import { SankeyChart } from "echarts/charts";
import { TitleComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useTheme } from "next-themes";
import type { FC } from "react";
import useSWR from "swr";

// Register components
echarts.use([TitleComponent, TooltipComponent, SankeyChart, CanvasRenderer]);

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const SankeyDiagram: FC = () => {
  const { resolvedTheme } = useTheme();
  const { data, error, isLoading } = useSWR("/sankey/api", fetcher);

  if (error) return <div className="text-danger">Failed to load data</div>;
  if (isLoading) return <div>Loading...</div>;

  if (!data?.nodes?.length) return <div>No data available for Sankey diagram</div>;

  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#e5e7eb" : "#1f2937"; // gray-200 vs gray-800

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: "Income vs Expenses Flow",
      left: "center",
      textStyle: {
        color: textColor,
      },
    },
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      backgroundColor: isDark ? "#18181b" : "#ffffff",
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      textStyle: {
        color: textColor,
      },
    },
    series: [
      {
        type: "sankey",
        data: data.nodes,
        links: data.links,
        emphasis: {
          focus: "adjacency",
        },
        label: {
          position: "right",
          formatter: "{b}: {c}",
          color: textColor,
        },
        lineStyle: {
          color: "source",
          curveness: 0.5,
        },
      },
    ],
  };

  return (
    <div className="w-full h-[600px]">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: "100%", width: "100%" }}
        theme={isDark ? "dark" : undefined}
      />
    </div>
  );
};
