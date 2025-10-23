"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { AmountTable } from "./amount-table";
import { LineChartRender } from "./line-charts";

export const TabsView = () => {
  return (
    <div>
      <Tabs variant="underlined">
        <Tab key="chart" title="Chart View">
          <LineChartRender />
        </Tab>
        <Tab key="table" title="Table View">
          <AmountTable />
        </Tab>
      </Tabs>
    </div>
  );
};
