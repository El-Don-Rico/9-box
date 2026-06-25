import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Turns an exception from a write into a 500 with a human-readable explanation.
// For known Prisma errors it maps the code to a likely cause (most commonly a
// migration that hasn't been applied to the database) and includes the raw
// message under `detail` to aid debugging.
export function dbErrorResponse(err: unknown, action: string) {
  console.error(`${action} failed:`, err);

  let hint = "";
  let detail = err instanceof Error ? err.message : String(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    detail = `[${err.code}] ${err.message}`;
    switch (err.code) {
      case "P2021": // table does not exist
      case "P2022": // column does not exist
        hint = "The database schema is out of date — a migration has not been applied.";
        break;
      case "P2003":
        hint = "A referenced record (user or cycle) does not exist.";
        break;
      case "P2002":
        hint = "A record with these values already exists.";
        break;
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    hint = "Could not connect to the database.";
  }

  return NextResponse.json(
    { error: `${action} failed.${hint ? " " + hint : ""}`, detail },
    { status: 500 }
  );
}
