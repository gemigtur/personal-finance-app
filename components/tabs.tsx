"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { AmountTable } from "./amount-table";
import { LineChartRender } from "./line-charts";

export const TabsView = () => {
  return (
    <div>
      <Tabs
        variant="underlined"
        classNames={{
          tabList:
            "sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-divider",
        }}
      >
        <Tab key="chart" title="Chart View">
          <LineChartRender grouped={false} percentage={false} />
        </Tab>
        <Tab key="table" title="Table View">
          <AmountTable />
        </Tab>
      </Tabs>
    </div>
  );
};
