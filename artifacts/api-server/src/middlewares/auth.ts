import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const JWT_SECRET = process.env.SESSION_SECRET || "saatvik-jain-secret";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    // Guard against stale tokens after DB resets/seeding by checking user existence.
    const [dbUser] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        status: usersTable.status,
      })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id))
      .limit(1);

    if (!dbUser || dbUser.status !== 1) {
      res.status(401).json({ error: "Session expired. Please login again." });
      return;
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email ?? decoded.email,
      role: dbUser.role ?? decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin only" });
    return;
  }
  next();
}

export function signToken(payload: { id: number; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
