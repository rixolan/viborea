import { useEffect, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, useOrganization, useOrganizationList, useUser } from "@clerk/clerk-react";

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!hasClerk) return children;
  return <SignedInGate>{children}</SignedInGate>;
}

function SignedInGate({ children, to = "/entrar/academia" }: { children: ReactNode; to?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (!isSignedIn) return <Navigate to={to} replace />;
  return children;
}

export function RequireAcademia({ children }: { children: ReactNode }) {
  if (!hasClerk) return children;
  return (
    <SignedInGate>
      <OrgGate>{children}</OrgGate>
    </SignedInGate>
  );
}

function OrgGate({ children }: { children: ReactNode }) {
  const { isLoaded: userLoaded } = useUser();
  const { organization, isLoaded } = useOrganization();
  const { isLoaded: listLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: true,
  });

  useEffect(() => {
    if (!listLoaded || organization || !setActive) return;
    const first = userMemberships.data?.[0];
    if (first) void setActive({ organization: first.organization.id });
  }, [listLoaded, organization, setActive, userMemberships.data]);

  if (!userLoaded || !isLoaded || !listLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (!organization && (userMemberships.data?.length ?? 0) === 0) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-8">
        <h1 className="text-2xl font-semibold">Academia</h1>
        <p className="text-sm text-stone-600">Esta cuenta no administra una academia. Si sos jugador, entrá desde el enlace de tu academia.</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/entrar" className="underline">
            Elegir cómo entrar
          </Link>
          <Link to="/registro" className="underline">
            Registrar academia
          </Link>
        </div>
      </div>
    );
  }
  if (!organization) return <p className="text-sm text-stone-500">Cargando academia…</p>;
  return children;
}
