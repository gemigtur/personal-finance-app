import { AccountCard } from "@/components/account-card";
import { AmountCard } from "@/components/amount-card";
import { AmountTable } from "@/components/amount-table";
import { LineChartRender } from "@/components/line-charts";

export default function Home() {
  return (
    <div>
      <p>hello</p>
      <AccountCard />
      <AmountCard />
      <AmountTable />
      <LineChartRender />
    </div>
  );
}
