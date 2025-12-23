"use client";

import type { Category, UnmappedReference } from "@/types";
import { Button, Select, SelectItem } from "@heroui/react";
import { TableCell, TableRow } from "@heroui/table";
import { useMemo, useState } from "react";

type Props = {
  item: UnmappedReference;
  categories: Category[];
  onAssign: (reference: string, categoryId: number) => Promise<void> | void;
};

export function UnmappedReferenceRow({ item, categories, onAssign }: Props) {
  const options = useMemo(() => categories.map(c => ({ key: String(c.id), label: c.name })), [categories]);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selected) return;
    try {
      setAssigning(true);
      await onAssign(item.reference, Number(selected));
      setSelected(undefined);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <TableRow key={item.reference}>
      <TableCell className="max-w-[40ch] truncate" title={item.reference}>
        {item.reference}
      </TableCell>
      <TableCell>
        <div
          className="relative z-10"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <Select
            aria-label={`Select category for ${item.reference}`}
            selectionMode="single"
            disallowEmptySelection
            isDisabled={options.length === 0}
            selectedKeys={selected ? (new Set([selected]) as any) : undefined}
            onSelectionChange={keys => {
              if (!keys || keys === "all") return;
              const k = Array.from(keys as Set<string>)[0] as string | undefined;
              setSelected(k);
            }}
            placeholder="Choose category"
            className="min-w-[220px]"
          >
            {options.map(o => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
        </div>
      </TableCell>
      <TableCell>
        <Button color="primary" size="sm" isDisabled={!selected} isLoading={assigning} onPress={handleAssign}>
          Assign
        </Button>
      </TableCell>
    </TableRow>
  );
}
