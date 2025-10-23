"use client";

import type { AmountTableProps } from "@/types";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { addToast } from "@heroui/toast";
import { useCallback, useMemo, useState, type Key } from "react";
import { HiTrash } from "react-icons/hi2";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const columns = [
  { name: "ID", uid: "id" },
  { name: "ACCOUNT", uid: "account_name" },
  { name: "AMOUNT", uid: "amount" },
  { name: "DATE", uid: "date" },
  { name: "ACTIONS", uid: "actions" },
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
  const { data, error, isLoading: loading, mutate } = useSWR<AmountPagedResponse>(key, fetcher);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedRow, setSelectedRow] = useState<AmountTableProps | null>(null);

  const handleDelete = async (row: AmountTableProps) => {
    try {
      const response = await fetch("/amount/api", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(row),
      });

      if (response.ok) {
        addToast({
          title: "Deleted!",
          description: `Deleted amount ${row.amount} from account ${row.account_name}.`,
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          color: "danger",
          variant: "flat",
        });
        mutate();
      } else {
        console.error("Failed to delete amount");
      }
    } catch (error) {
      console.error("Error deleting amount:", error);
    }
  };

  const renderCell = useCallback((row: AmountTableProps, columnKey: Key) => {
    switch (columnKey) {
      case "id":
        return <span>{row.id}</span>;
      case "account_name":
        return <Chip color={row.account_color}>{row.account_name}</Chip>;
      case "amount":
        return <span>{row.amount}</span>;
      case "date":
        return <span>{row.date.split("T")[0]}</span>;
      case "actions":
        return (
          <Button
            isIconOnly
            color="danger"
            variant="light"
            radius="full"
            onPress={() => {
              setSelectedRow(row);
              onOpen();
            }}
          >
            <HiTrash />
          </Button>
        );
      default:
        return null;
    }
  }, []);

  return (
    <>
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
          {item => (
            <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="bg-danger">
                <div className="flex flex-row gap-4">
                  <HiTrash className="mt-1" />
                  Delete Amount
                </div>
              </ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete this amount?</p>
                <p>
                  {selectedRow?.amount} $ from the account {selectedRow?.account_name}
                </p>
                <p className="text-danger">This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 justify-end w-full">
                  <Button variant="light" color="default" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    color="danger"
                    endContent={<HiTrash />}
                    onPress={() => {
                      if (selectedRow) {
                        void handleDelete(selectedRow);
                      }
                      onClose();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
