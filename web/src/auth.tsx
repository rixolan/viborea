import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useOrganization, useOrganizationList, useUser } from "@clerk/clerk-react";

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!hasClerk) return children;
  return <SignedInGate>{children}</SignedInGate>;
}

function SignedInGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (!isSignedIn) return <Navigate to="/entrar" replace />;
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
  const { user, isLoaded: userLoaded } = useUser();
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
  if (user?.publicMetadata?.role === "academia") return children;
  if (!organization && (userMemberships.data?.length ?? 0) === 0) {
    return <Navigate to="/academia/nueva" replace />;
  }
  if (!organization) return <p className="text-sm text-stone-500">Cargando academia…</p>;
  return children;
}
