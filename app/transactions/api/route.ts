import type { TransactionRecord, UploadResult } from "@/types";
import { sql } from "@/utils/db";

async function ensureSchema() {
  // Create categories and transactions tables if they don't exist
  await sql`
    create table if not exists categories (
      id serial primary key,
      name text not null unique
    );
  `;

  await sql`
    create table if not exists transactions (
      id serial primary key,
      date date not null,
      reference text not null,
      description text,
      amount numeric(14,2) not null,
      balance numeric(14,2),
      category_id int references categories(id) on delete set null,
      unique_hash text not null unique
    );
  `;
}

function normalize(rec: TransactionRecord) {
  return {
    date: rec.date,
    reference: rec.reference?.trim() ?? "",
    description: rec.description?.toString().trim() ?? null,
    amount: Number(rec.amount),
    balance: rec.balance == null ? null : Number(rec.balance),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const records = (body?.records ?? []) as TransactionRecord[];
    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ error: "No records provided" }, { status: 400 });
    }

    await ensureSchema();

    // Normalize and split columns
    const normalized = records.map(normalize);
    const dates = normalized.map(r => r.date);
    const refs = normalized.map(r => r.reference);
    const descs = normalized.map(r => r.description ?? null);
    const amounts = normalized.map(r => r.amount);
    const balances = normalized.map(r => r.balance ?? null);

    // Insert in bulk using UNNEST, generating hash server-side to de-dupe
    const res = await sql`
      with data as (
        select 
          u.date::date as date,
          u.reference::text as reference,
          u.description::text as description,
          u.amount::numeric as amount,
          u.balance::numeric as balance,
          md5(
            coalesce(u.reference,'') || '|' || coalesce(u.description,'') || '|' || u.date::text || '|' || u.amount::text
          ) as unique_hash
        from unnest(
          ${dates}::date[],
          ${refs}::text[],
          ${descs}::text[],
          ${amounts}::numeric[],
          ${balances}::numeric[]
        ) as u(date, reference, description, amount, balance)
      )
      insert into transactions (date, reference, description, amount, balance, unique_hash)
      select date, reference, description, amount, balance, unique_hash from data
      on conflict (unique_hash) do nothing
      returning 1 as inserted;
    `;

    const inserted = Array.isArray(res) ? res.length : 0;
    const total = records.length;
    const payload: UploadResult = { inserted, skipped: total - inserted, total };
    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Upload failed", { status: 500 });
  }
}
