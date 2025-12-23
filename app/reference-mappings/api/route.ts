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

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const reference = String(body?.reference ?? "").trim();
    const category_id = Number(body?.category_id ?? NaN);
    if (!reference) return Response.json({ error: "reference is required" }, { status: 400 });
    if (!Number.isFinite(category_id)) return Response.json({ error: "category_id is required" }, { status: 400 });

    const normalized = reference.toLowerCase().trim();

    await sql`
      insert into reference_mappings (normalized_reference, category_id)
      values (${normalized}, ${category_id})
      on conflict (normalized_reference) do update set category_id = excluded.category_id
    `;

    const updated = await sql`
      update transactions
      set category_id = ${category_id}
      where lower(trim(reference)) = ${normalized}
        and (category_id is distinct from ${category_id} or category_id is null)
      returning id
    `;

    return Response.json({ normalized_reference: normalized, category_id, updated: updated.length }, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Failed to create mapping", { status: 500 });
  }
}
