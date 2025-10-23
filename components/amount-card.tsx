"use client";

import type { AccountProps } from "@/types";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import type { Selection } from "@heroui/react";
import { Button, DatePicker, NumberInput, Spinner } from "@heroui/react";
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

  const submit = async () => {
    if ((account instanceof Set ? account.size : 0) === 0 || !amount || !date) return;

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
  };

  return (
    <Card>
      <CardHeader>Add amount</CardHeader>
      <CardBody>
        {loading || error ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4">
            <Select items={data} label="Select account" selectedKeys={account} onSelectionChange={setAccount}>
              {account => <SelectItem key={account.id}>{account.name}</SelectItem>}
            </Select>
            <NumberInput
              label="Amount"
              startContent={<p className="text-sm text-gray-400">$</p>}
              value={amount}
              onValueChange={setAmount}
            />
            <DatePicker label="Pick date" value={date} onChange={setDate} />

            <Button color="success" className="w-full" onPress={submit}>
              Add amount
            </Button>
          </div>
        )}
      </CardBody>
      <CardFooter>
        <p>Total amount...</p>
      </CardFooter>
    </Card>
  );
};
