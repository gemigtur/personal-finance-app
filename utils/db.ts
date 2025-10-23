import postgres from "postgres";

export const sql = postgres(process.env.DB_URI ?? "postgres://username:password@host:port/database", {});
