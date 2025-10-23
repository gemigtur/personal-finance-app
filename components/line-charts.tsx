"use client";

// import the core library.
import ReactEChartsCore from "echarts-for-react/lib/core";
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from "echarts/renderers";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const LineChartRender = () => {
  // Register the required components
  echarts.use([TitleComponent, TooltipComponent, GridComponent, LineChart, CanvasRenderer, LegendComponent]);
  const url = `/amount/api?order=desc`;
  const { data, error, isLoading: loading } = useSWR(url, fetcher);

  if (error) return <p>error..</p>;

  if (loading) return <p>loading..</p>;

  const x = data ? [...new Set(data.data.map((d: any) => d.date.split("T")[0]))] : [];
  // const y = data ? data.data.map((d: any) => d.amount) : [];
  const accounts = new Set(data.data.map((d: any) => d.account_name));

  const series = [...accounts].map(a => {
    return {
      type: "line",
      name: a,
      smooth: true,
      // areaStyle: {
      //   opacity: 0.5,
      // },
      data: data.data.filter((r: any) => a === r.account_name).map((r: any) => r.amount),
    };
  });

  console.log(series);

  console.log("data:", data);
  const option = {
    legend: {
      data: [...accounts],
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

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      theme={"theme_name"}
      /* onChartReady={this.onChartReadyCallback}
      onEvents={EventsDict}
      opts={} */
    />
  );
};
