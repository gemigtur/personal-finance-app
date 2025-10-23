import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type AccountProps = {
  id: number;
  name: string;
  amount: number;
};

export type AmountProps = {
  id: number;
  amount: number;
  date: string;
  fk_account: number;
};

export type AmountTableProps = {
  account_name: string;
} & AmountProps;
