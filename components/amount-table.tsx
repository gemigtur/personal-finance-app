"use client";

import type { AmountTableProps } from "@/types";
import { Pagination } from "@heroui/pagination";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useCallback, useMemo, useState, type Key } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const columns = [
  { name: "ID", uid: "id" },
  { name: "ACCOUNT", uid: "account_name" },
  { name: "AMOUNT", uid: "amount" },
  { name: "DATE", uid: "date" },
];

type AmountPagedResponse = {
  data: AmountTableProps[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export const AmountTable = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const key = useMemo(() => `/amount/api?page=${page}&limit=${rowsPerPage}`, [page, rowsPerPage]);
  const { data, error, isLoading: loading } = useSWR<AmountPagedResponse>(key, fetcher);

  const renderCell = useCallback((row: AmountTableProps, columnKey: Key) => {
    switch (columnKey) {
      case "id":
        return <span>{row.id}</span>;
      case "account_name":
        return <span>{row.account_name}</span>;
      case "amount":
        return <span>{row.amount}</span>;
      case "date":
        return <span>{row.date}</span>;
      default:
        return null;
    }
  }, []);

  return (
    <Table
      isHeaderSticky
      removeWrapper
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={data?.page ?? page}
            total={data?.totalPages ?? 1}
            onChange={setPage}
          />
        </div>
      }
    >
      <TableHeader columns={columns}>
        {column => (
          <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={data?.data ?? []}
        isLoading={loading}
        emptyContent={error ? "Failed to load amounts" : "No amounts found."}
      >
        {item => <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
      </TableBody>
    </Table>
  );
};
