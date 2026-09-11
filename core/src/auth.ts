import { verifyToken } from "@clerk/backend";
import { academyById, academyBySlug, ensureAcademyFromOrg, type Academy, type Db } from "./db";
import { DG_ACADEMY_ID } from "./seed";
import { isProduction } from "./secret";

export type ClerkAuth = {
  userId: string;
  orgId: string | null;
  orgSlug: string | null;
  orgName: string | null;
};

type JwtClaims = {
  sub?: string;
  org_id?: string;
  org_slug?: string;
  o?: { id?: string; slg?: string; nam?: string };
};

function clerkSecret(): string | undefined {
  const raw = process.env.CLERK_SECRET_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "") || undefined;
}

export async function readClerk(req: Request): Promise<ClerkAuth | null> {
  const secret = clerkSecret();
  const hdr = req.headers.get("authorization") ?? "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!secret || !token) return null;
  try {
    const payload = (await verifyToken(token, { secretKey: secret })) as JwtClaims;
    const userId = payload.sub;
    if (!userId) return null;
    return {
      userId,
      orgId: payload.org_id ?? payload.o?.id ?? null,
      orgSlug: payload.org_slug ?? payload.o?.slg ?? null,
      orgName: payload.o?.nam ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireAcademy(req: Request, db: Db): Promise<{ academy: Academy } | Response> {
  const secret = clerkSecret();
  if (!secret) {
    // Without Clerk there is no way to tell staff from anyone on the internet.
    // In production that must be a hard stop, never the pilot academy wide open.
    if (isProduction()) {
      console.error("CLERK_SECRET_KEY ausente: /api staff rechazado");
      return Response.json({ error: "Autenticación no configurada" }, { status: 503 });
    }
    const ac = (await academyBySlug(db, "academiadg")) ?? (await academyById(db, DG_ACADEMY_ID));
    return { academy: ac };
  }
  const auth = await readClerk(req);
  if (!auth) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!auth.orgId || !auth.orgSlug) {
    return Response.json({ error: "Elegí una academia" }, { status: 403 });
  }
  try {
    const academy = await ensureAcademyFromOrg(db, {
      orgId: auth.orgId,
      orgSlug: auth.orgSlug,
      name: auth.orgName ?? auth.orgSlug,
    });
    return { academy };
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
