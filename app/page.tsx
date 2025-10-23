import { AccountCard } from "@/components/account-card";
import { AmountCard } from "@/components/amount-card";
import { TabsView } from "@/components/tabs";

export default function Home() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-2">
        <AmountCard />
        <AccountCard />
      </div>
      <TabsView />
    </div>
  );
}
