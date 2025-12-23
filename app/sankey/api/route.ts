import { sql } from "@/utils/db";

export async function GET() {
  try {
    // Fetch aggregated data, separating income and expenses even for the same category
    const data = await sql`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as name,
        CASE WHEN t.amount >= 0 THEN 'income' ELSE 'expense' END as type,
        SUM(ABS(t.amount)) as value
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      GROUP BY c.name, type
    `;

    const income: { name: string; value: number }[] = [];
    const expenses: { name: string; value: number }[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const row of data) {
      const val = Number(row.value);
      if (row.type === "income") {
        income.push({ name: row.name, value: val });
        totalIncome += val;
      } else {
        expenses.push({ name: row.name, value: val });
        totalExpenses += val;
      }
    }

    const nodes = new Set<string>();
    const links = [];

    // Central Node
    const centerNode = "Total Income";
    nodes.add(centerNode);

    // Process Income
    income.forEach(i => {
      // If an income category has the same name as an expense category, we might want to distinguish them
      // But usually categories are either income or expense.
      // If "Uncategorized" is in both, we need to handle it.
      // Let's append " (Income)" if it exists in expenses too?
      // Or just always append source/target context?
      // ECharts nodes are identified by name.

      let nodeName = i.name;
      // Check if this name also exists in expenses
      if (expenses.some(e => e.name === i.name)) {
        nodeName = `${i.name} (Income)`;
      }

      nodes.add(nodeName);
      links.push({ source: nodeName, target: centerNode, value: i.value });
    });

    // Process Expenses
    expenses.forEach(e => {
      let nodeName = e.name;
      // If we renamed the income one, the expense one can stay as is, or be renamed too.
      // If we didn't rename income (because it wasn't in expenses), we are good.
      // But wait, if I renamed income to "X (Income)", then "X" is free for expense.
      // But if I have "Uncategorized" in both:
      // Income: "Uncategorized (Income)"
      // Expense: "Uncategorized"
      // This works.

      nodes.add(nodeName);
      links.push({ source: centerNode, target: nodeName, value: e.value });
    });

    // Excess
    const excess = totalIncome - totalExpenses;
    if (excess > 0) {
      nodes.add("Excess");
      links.push({ source: centerNode, target: "Excess", value: excess });
    }

    const nodesList = Array.from(nodes).map(name => ({ name }));

    return Response.json({ nodes: nodesList, links });
  } catch (e) {
    console.error(e);
    return new Response("Failed to fetch sankey data", { status: 500 });
  }
}
