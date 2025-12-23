import { AccountCard } from "@/components/account-card";
import { AmountCard } from "@/components/amount-card";
import { LineChartRender } from "@/components/line-charts";
import { SankeyDiagram } from "@/components/sankey-chart";
import { StatCard } from "@/components/stat-card";
import { TabsView } from "@/components/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-10">
      {/* Insights */}
      <section className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-4 md:p-6">
        <div className="sticky top-0 z-30 -mx-2 -mt-2 mb-2 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
          <div className="md:col-span-12 xl:col-span-7">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">Balance over time</h2>
              </CardHeader>
              <CardBody>
                {/* If your LineChart accepts props, keep them; otherwise it will ignore */}
                <LineChartRender grouped={true} percentage={false} showBadge={true} showTotal={true} />
              </CardBody>
            </Card>
          </div>
          <div className="md:col-span-12 xl:col-span-5">
            <StatCard grouped={false} percentage={false} />
          </div>
        </div>
        <div className="md:col-span-12">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">Cash Flow (Sankey)</h2>
            </CardHeader>
            <CardBody>
              <SankeyDiagram />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Actions + Data */}
      <section className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-4 md:p-6">
        <div className="sticky top-0 z-30 -mx-2 -mt-2 mb-2 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Manage & Explore</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="flex flex-col gap-6 md:col-span-4">
            <AmountCard />
            <AccountCard />
          </div>
          <div className="md:col-span-8">
            <TabsView />
          </div>
        </div>
      </section>
    </main>
  );
}
