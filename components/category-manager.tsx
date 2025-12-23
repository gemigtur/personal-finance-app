"use client";

import type { Category } from "@/types";
import { Button, Input } from "@heroui/react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function CategoryManager() {
  const { data, mutate, isLoading } = useSWR<Category[]>("/categories/api", fetcher);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const onAdd = async () => {
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await fetch("/categories/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      mutate();
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const onSave = async () => {
    if (!editingId || !editingName.trim()) return;
    const newName = editingName.trim();
    // optimistic
    const prev = data ?? [];
    mutate(
      prev.map(c => (c.id === editingId ? { ...c, name: newName } : c)),
      { revalidate: false }
    );
    try {
      await fetch("/categories/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: newName }),
      });
      mutate();
      setEditingId(null);
      setEditingName("");
    } catch (e) {
      mutate();
    }
  };

  const onDelete = async (id: number) => {
    const prev = data ?? [];
    mutate(
      prev.filter(c => c.id !== id),
      { revalidate: false }
    );
    try {
      await fetch(`/categories/api?id=${id}`, { method: "DELETE" });
      mutate();
    } catch (e) {
      mutate();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          label="New category"
          placeholder="e.g. Groceries"
          value={name}
          onChange={e => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button color="primary" onPress={onAdd} isDisabled={!name.trim()} isLoading={submitting}>
          Add
        </Button>
      </div>
      <Table aria-label="Categories list" removeWrapper isHeaderSticky>
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody items={data ?? []} emptyContent={isLoading ? "Loading..." : "No categories"}>
          {(item: Category) => (
            <TableRow key={item.id}>
              <TableCell>
                {editingId === item.id ? (
                  <Input
                    size="sm"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  item.name
                )}
              </TableCell>
              <TableCell>
                {editingId === item.id ? (
                  <div className="flex gap-2">
                    <Button size="sm" color="success" onPress={onSave} isDisabled={!editingName.trim()}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="light" onPress={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" color="danger" variant="light" onPress={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
