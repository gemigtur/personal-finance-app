"use client";

import type { AccountProps } from "@/types";
import { colors } from "@/utils/constans";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Selection,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { useCallback, useState, type Key } from "react";
import { HiPencil, HiTrash } from "react-icons/hi2";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(res => res.json());

const columns = [
  { name: "ID", uid: "id" },
  { name: "NAME", uid: "name" },
  { name: "AMOUNT", uid: "amount" },
  { name: "ACTIONS", uid: "actions" },
];

type ActionsProps = {
  account: AccountProps;
  onUpdate: (account: AccountProps, name: string, color: AccountProps["color"]) => Promise<void> | void;
  onDelete: (account: AccountProps) => Promise<void> | void;
};

const Actions = ({ account, onUpdate, onDelete }: ActionsProps) => {
  const [updateName, setUpdateName] = useState(account.name);
  const [updateColor, setUpdateColor] = useState<Selection>(new Set([account.color ?? "default"]));
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Popover placement="bottom" isOpen={isOpen} onOpenChange={open => setIsOpen(open)}>
        <PopoverTrigger>
          <Button isIconOnly variant="light">
            <HiPencil />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {titleProps => (
            <div className="flex flex-col gap-2 py-2">
              <p>Update account</p>
              <Input label="New name" size="sm" onValueChange={setUpdateName} isClearable value={updateName} />
              <Select
                selectedKeys={updateColor}
                onSelectionChange={setUpdateColor}
                startContent={<Chip className="w-6 h-4" color={Array.from(updateColor)[0] as AccountProps["color"]} />}
              >
                {colors.map(color => (
                  <SelectItem key={color} startContent={<Chip color={color} className="w-6 h-4" />}>
                    {color}
                  </SelectItem>
                ))}
              </Select>
              <Button
                size="sm"
                color="primary"
                className="w-full"
                onPress={() => {
                  // extract single selected color from Selection
                  const selectedColor =
                    updateColor === "all"
                      ? (account.color ?? "default")
                      : (Array.from(updateColor)[0] as AccountProps["color"]);
                  onUpdate(account, updateName, selectedColor);
                  setIsOpen(false);
                }}
              >
                Update
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Button color="danger" isIconOnly variant="light" onPress={() => onDelete(account)}>
        <HiTrash />
      </Button>
    </div>
  );
};

export const AccountCard = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [name, setName] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);

  const { data, error, isLoading: loading, mutate } = useSWR<AccountProps[]>("/account/api", fetcher);

  const submit = async (name: string) => {
    setError(false);
    setLoading(true);

    const msg = {
      name,
    };

    const response = await fetch("/account/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    }).then(res => {
      if (res.ok) {
        setLoading(false);
        setName("");
        mutate();
      } else {
        setLoading(false);
        setError(true);
      }
    });
  };

  const deleteAccount = async (account: AccountProps) => {
    // optimistic update (new array without deleted object)
    mutate(curr => curr?.filter(a => a.id !== account.id) ?? [], {
      revalidate: false,
      rollbackOnError: true,
    });
    await fetch("/account/api", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });

    mutate();
  };

  const updateAccount = async (account: AccountProps, name: string, color: AccountProps["color"]) => {
    // optimistic update (new array + new object)
    mutate(curr => curr?.map(a => (a.id === account.id ? { ...a, name, color: color ?? a.color } : a)) ?? [], {
      revalidate: false,
      rollbackOnError: true,
    });

    await fetch("/account/api", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...account, name, color }),
    });

    // ensure server truth
    mutate();
  };

  const renderCell = useCallback(
    (account: AccountProps, columnKey: Key) => {
      switch (columnKey) {
        case "id":
          return <p>{account.id}</p>;
        case "name":
          return <Chip color={account.color}>{account.name}</Chip>;
        case "amount":
          return <p>{account.amount}</p>;
        case "actions":
          return <Actions account={account} onUpdate={updateAccount} onDelete={deleteAccount} />;
        default:
          return "";
      }
    },
    [updateAccount, deleteAccount]
  );

  return (
    <>
      <Card>
        <CardHeader>Create Account</CardHeader>
        <CardBody className="gap-4">
          {isError && <p className="text-red-500">Something went wrong!</p>}
          <Input label="Account name" onValueChange={setName} value={name} />
          <Button
            variant="solid"
            color="success"
            isDisabled={name.trim() === ""}
            isLoading={isLoading}
            onPress={() => submit(name)}
            type="submit"
          >
            Create
          </Button>
          <Table isHeaderSticky removeWrapper>
            <TableHeader columns={columns}>
              {column => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={data ?? []} isLoading={loading} emptyContent="No accounts found.">
              {item => (
                <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
        <CardFooter>
          <p>Total accounts: {data?.length ?? 0}</p>
        </CardFooter>
      </Card>
    </>
  );
};
