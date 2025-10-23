import { sql } from "@/utils/db";

/**
 * Get amounts with optional filtering by fk_accounts and date_range
 * @param req
 * @returns Response
 */
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const fk_accounts = params.get("fk_accounts");
    const date_range = params.get("date_range");
    const rawOrder = params.get("order");
    const grouped = params.get("grouped");
    const isGrouped = grouped ? !["false", "0", "no"].includes(grouped.toLowerCase()) : false;
    const direction = rawOrder?.toLowerCase() === "asc" ? "asc" : "desc";
    // pagination params with basic validation and sane defaults
    const rawPage = params.get("page");
    const rawLimit = params.get("limit");
    let page = rawPage ? Number(rawPage) : undefined;
    let limit = rawLimit ? Number(rawLimit) : undefined;

    // Build reusable FROM and WHERE clauses to keep order: FROM ... JOIN ... WHERE ...
    const fromClause = sql`from amount join accounts a on a.id = amount.fk_account`;

    const whereParts: any[] = [];

    if (fk_accounts) {
      const accounts = fk_accounts.split(",").map(id => Number(id));
      whereParts.push(sql`amount.fk_account = any(${accounts}::int[])`);
    }

    if (date_range) {
      const [start, end] = date_range.split(",");
      // Only add if both dates exist
      if (start && end) {
        whereParts.push(sql`amount.date >= ${start}::date and amount.date <= ${end}::date`);
      } else if (start) {
        whereParts.push(sql`amount.date >= ${start}::date`);
      } else if (end) {
        whereParts.push(sql`amount.date <= ${end}::date`);
      }
    }

    // Build where clause incrementally to avoid reliance on sql.join (not available in current typings)
    let whereClause = sql``;
    if (whereParts.length > 0) {
      // start with first condition
      whereClause = sql`where ${whereParts[0]}`;
      for (let i = 1; i < whereParts.length; i++) {
        whereClause = sql`${whereClause} and ${whereParts[i]}`;
      }
    }

    let limitOffsetClause = sql``;
    if (page && limit) {
      if (!Number.isFinite(page) || page < 1) page = 1;
      if (!Number.isFinite(limit) || limit < 1) limit = 10;
      if (limit > 100) limit = 100; // clamp max page size
      const offset = (page - 1) * limit;

      limitOffsetClause = sql`limit ${limit} offset ${offset}`;
    }

    const orderClause = direction === "asc" ? sql`order by amount.date asc` : sql`order by amount.date desc`;

    // Data query with pagination (switch depending on grouping)
    const dataQuery = isGrouped
      ? sql`
        select 
          amount.date,
          sum(amount.amount) as amount,
          'All'::text as account_name,
          null::text as account_color
        ${fromClause}
        ${whereClause}
        group by amount.date
        ${orderClause}
        ${limitOffsetClause}
      `
      : sql`
        select 
          amount.id, 
          amount.amount, 
          amount.date, 
          a.name as account_name,
          a.color as account_color
        ${fromClause}
        ${whereClause}
        ${orderClause}
        ${limitOffsetClause}
      `;

    if (!page || !limit) {
      const amounts = await dataQuery;

      return Response.json({
        data: amounts,
      });
    }

    // Count query for total rows (without pagination)
    const countQuery = isGrouped
      ? sql`
        select count(*)::int as total
        from (
          select amount.date
          ${fromClause}
          ${whereClause}
          group by amount.date
        ) t
      `
      : sql`
        select count(*)::int as total
        ${fromClause}
        ${whereClause}
      `;

    const [amounts, countRows] = await Promise.all([dataQuery, countQuery]);
    const total = countRows?.[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return Response.json({
      data: amounts,
      page,
      limit,
      total,
      totalPages,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    return new Response("Error!", {
      status: 400,
    });
  }
}

export async function POST(req: Request, res: Response) {
  try {
    const amount = await req.json();

    await sql`
    insert into amount 
      (amount, date, fk_account) 
    values (${amount.amount}, ${amount.date}, ${amount.fk_account})
    `;
    return new Response("Success", {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response("Error!", {
      status: 400,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const amount = await req.json();

    const res = await sql`delete from amount where id = ${amount.id}`;

    return Response.json(res);
  } catch (error) {
    console.log(error);
    return new Response("Error!", {
      status: 400,
    });
  }
}
