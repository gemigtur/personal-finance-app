import type { UnmappedReference } from "@/types";
import { sql } from "@/utils/db";

async function ensureSchema() {
  await sql`
    create table if not exists categories (
      id serial primary key,
      name text not null unique
    );
  `;
  await sql`
    create table if not exists reference_mappings (
      normalized_reference text primary key,
      category_id int not null references categories(id) on delete cascade
    );
  `;
}

export async function GET(req: Request) {
  await ensureSchema();
  const url = new URL(req.url);
  const unmapped = url.searchParams.get("unmapped") === "true";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const offset = (page - 1) * limit;
  const q = url.searchParams.get("q");
  const like = q && q.trim().length > 0 ? `%${q.trim()}%` : null;

  if (!unmapped) {
    // For now only support unmapped listing
    return Response.json({ error: "Only unmapped=true is supported" }, { status: 400 });
  }

  // Get total count of distinct unmapped references
  const totalRows = await sql<{ count: number }[]>`
    with t as (
      select lower(trim(reference)) as key, reference
      from transactions
    ), grouped as (
      select key, min(reference) as sample
      from t
      group by key
    )
    select count(*)::int as count
    from grouped g
    left join reference_mappings rm on g.key = rm.normalized_reference
    where rm.normalized_reference is null
    ${like ? sql`and g.sample ilike ${like}` : sql``}
  `;
  const total = totalRows?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows = await sql<UnmappedReference[]>`
    with t as (
      select lower(trim(reference)) as key, reference
      from transactions
    ), grouped as (
      select key, min(reference) as sample
      from t
      group by key
    )
    select sample as reference
    from grouped g
    left join reference_mappings rm on g.key = rm.normalized_reference
    where rm.normalized_reference is null
    ${like ? sql`and g.sample ilike ${like}` : sql``}
    order by sample asc
    limit ${limit}
    offset ${offset}
  `;

  return Response.json({ data: rows, page, limit, total, totalPages }, { status: 200 });
}
