import type { ChipProps } from "@heroui/react";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type AccountProps = {
  id: number;
  name: string;
  amount: number;
  color: ChipProps["color"];
};

export type AmountProps = {
  id: number;
  amount: number;
  date: string;
  fk_account: number;
};

export type AmountTableProps = {
  account_name: string;
  account_color: ChipProps["color"];
} & AmountProps;

export type TransactionRecord = {
  date: string; // ISO or YYYY-MM-DD
  reference: string;
  description?: string | null;
  amount: number; // positive income, negative expense
  balance?: number | null; // amount left after transaction
};

export type UploadResult = {
  inserted: number;
  skipped: number; // duplicates
  total: number;
};

export type Mapping = {
  date?: string;
  reference?: string;
  description?: string;
  amount?: string;
  balance?: string;
};

export type Category = {
  id: number;
  name: string;
};

export type UnmappedReference = {
  reference: string;
};

export type ReferenceMapping = {
  normalized_reference: string;
  category_id: number;
};
