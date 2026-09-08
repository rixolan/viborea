export async function requireAcademy(req: Request): Promise<Response | null> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;
  const hdr = req.headers.get("authorization") ?? "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { verifyToken } = await import("@clerk/backend");
    await verifyToken(token, { secretKey: secret });
    return null;
  } catch {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
}
