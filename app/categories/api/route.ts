import type { Category } from "@/types";
import { sql } from "@/utils/db";

async function ensureSchema() {
  await sql`
    create table if not exists categories (
      id serial primary key,
      name text not null unique
    );
  `;
}

export async function GET() {
  await ensureSchema();
  const rows = await sql<Category[]>`select id, name from categories order by name asc`;
  return Response.json(rows, { status: 200 });
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

    const res = await sql<Category[]>`
      insert into categories (name)
      values (${name})
      on conflict (name) do update set name = excluded.name
      returning id, name
    `;
    return Response.json(res[0], { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Failed to create category", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json();
    const id = Number(body?.id ?? NaN);
    const name = String(body?.name ?? "").trim();
    if (!Number.isFinite(id)) return Response.json({ error: "id is required" }, { status: 400 });
    if (!name) return Response.json({ error: "name is required" }, { status: 400 });
    const res = await sql<Category[]>`
      update categories set name = ${name} where id = ${id}
      returning id, name
    `;
    if (!res.length) return Response.json({ error: "Category not found" }, { status: 404 });
    return Response.json(res[0], { status: 200 });
  } catch (e: any) {
    console.error(e);
    const msg = String(e?.message || "");
    if (msg.includes("unique")) return new Response("Category name already exists", { status: 409 });
    return new Response("Failed to update category", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");
    const id = idParam ? Number(idParam) : Number((await req.json())?.id ?? NaN);
    if (!Number.isFinite(id)) return Response.json({ error: "id is required" }, { status: 400 });
    const res = await sql`delete from categories where id = ${id} returning id`;
    if (!Array.isArray(res) || res.length === 0) return Response.json({ error: "Category not found" }, { status: 404 });
    return Response.json({ deleted: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Failed to delete category", { status: 500 });
  }
}
