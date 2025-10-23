"use client";

import type { AccountProps } from "@/types";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import type { Selection } from "@heroui/react";
import { addToast, Button, DatePicker, NumberInput, Spinner } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@react-types/datepicker";
import { useState } from "react";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(res => res.json());

export const AmountCard = () => {
  const { data, error, isLoading: loading, mutate } = useSWR<AccountProps[]>("/account/api", fetcher);
  const [account, setAccount] = useState<Selection>(new Set([]));
  const [amount, setAmount] = useState<number>();
  const [date, setDate] = useState<DateValue | null>(parseDate(new Date().toISOString().split("T")[0]));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) return;
    if ((account instanceof Set ? account.size : 0) === 0 || !amount || !date) return;
    setIsSubmitting(true);

    try {
      const msg = {
        fk_account: Number(Array.from(account)[0]),
        amount,
        date: date.toString(),
      };

      const response = await fetch("/amount/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      });

      if (response.ok) {
        setAmount(undefined);
        addToast({
          title: "Success",
          description: `
          Added ${amount} $ successfully for account ${data?.find(a => a.id === Number(Array.from(account)[0]))?.name}
        `,
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          color: "success",
          variant: "flat",
        });
      } else {
        addToast({
          title: "Error",
          description: "There was an error adding the amount.",
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          color: "danger",
          variant: "flat",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void submit();
  };

  return (
    <Card>
      <CardHeader>Add amount</CardHeader>
      <CardBody>
        {loading || error ? (
          <Spinner />
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Select items={data} label="Select account" selectedKeys={account} onSelectionChange={setAccount}>
              {account => <SelectItem key={account.id}>{account.name}</SelectItem>}
            </Select>
            <NumberInput
              label="Amount"
              startContent={<p className="text-sm text-gray-400">$</p>}
              value={amount}
              onValueChange={setAmount}
              isClearable
            />
            <DatePicker label="Pick date" value={date} onChange={setDate} />

            <Button type="submit" color="success" className="w-full">
              Add amount
            </Button>
          </form>
        )}
      </CardBody>
      <CardFooter>
        <p>Total amount...</p>
      </CardFooter>
    </Card>
  );
};
