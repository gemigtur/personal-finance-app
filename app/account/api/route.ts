import type { AccountProps } from "@/types";
import { sql } from "@/utils/db";

export async function POST(req: Request, res: Response) {
  const account: AccountProps = await req.json();

  console.log(account);

  try {
    await sql`insert into accounts (name) values (${account.name})`;

    return new Response("Success", {
      status: 200,
    });
  } catch (error) {
    return new Response("Error!", {
      status: 400,
    });
  }
}

export async function GET(req: Request) {
  try {
    const accounts = await sql`
      select 
        a.id,
        a.name,
        coalesce(am.amount, 0) as amount
      from accounts a
      left join lateral (
        select amount, date
        from amount
        where amount.fk_account = a.id
        order by amount.date desc
        limit 1
      ) am on true
    `;

    return Response.json(accounts);
  } catch (error) {
    console.log(error);
    return new Response("Error!", {
      status: 400,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const account = await req.json();

    const res = await sql`delete from accounts where id = ${account.id}`;

    return Response.json(res);
  } catch {
    return new Response("Error!", {
      status: 400,
    });
  }
}

export async function PUT(req: Request) {
  try {
    const account = await req.json();

    const res = await sql`update accounts set name = ${account.name} where id = ${account.id}`;

    return Response.json(res);
  } catch (error) {
    console.log(error);
    return new Response("Error!", {
      status: 400,
    });
  }
}
