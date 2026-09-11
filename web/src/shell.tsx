import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth, useOrganization, useUser } from "@clerk/clerk-react";
import { api } from "./api";

function AuthSlot() {
  const loc = useLocation();
  const booker = loc.pathname.match(/^\/reservar\/([^/]+)/);
  const entrar = booker ? `/entrar/jugador/${booker[1]}` : "/entrar";
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <Link to={entrar} className="text-sm text-stone-600 hover:text-stone-900">
        Entrar
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <Link to={entrar} className="text-sm text-stone-600 hover:text-stone-900">
          Entrar
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}

function StaffLinks() {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [booker, setBooker] = useState("");
  const staff = Boolean(organization) || user?.publicMetadata?.role === "academia";
  useEffect(() => {
    if (!staff) return;
    void (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const s = await api.settings(token);
        setBooker(s.booker_path);
      } catch {
        setBooker("");
      }
    })();
  }, [staff, getToken]);
  if (!staff) return null;
  const item = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`;
  return (
    <>
      <NavLink to="/academia" className={item}>
        Academia
      </NavLink>
      {booker ? (
        <NavLink to={booker} className={item}>
          Reservar
        </NavLink>
      ) : null}
    </>
  );
}

export function Shell() {
  const loc = useLocation();
  const publicHome = loc.pathname === "/";
  const booker = loc.pathname.startsWith("/reservar");
  const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Viborea
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {hasClerk ? (
              <SignedIn>
                <StaffLinks />
              </SignedIn>
            ) : null}
          </nav>
          <div className="flex items-center gap-2">
            <AuthSlot />
          </div>
        </div>
      </header>
      <main className={publicHome ? "" : booker ? "mx-auto max-w-6xl px-4 py-6" : "mx-auto max-w-5xl px-4 py-8"}>
        <Outlet />
      </main>
    </div>
  );
}
