import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const areas = [
  { to: "/reservar", label: "Reservar" },
  { to: "/jugador", label: "Jugador" },
  { to: "/academia", label: "Academia" },
] as const;

function AuthSlot() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <Link to="/entrar" className="text-sm text-stone-600 hover:text-stone-900">
        Entrar
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <Link to="/entrar" className="text-sm text-stone-600 hover:text-stone-900">
          Entrar
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}

export function Shell() {
  const loc = useLocation();
  const publicHome = loc.pathname === "/";
  const booker = loc.pathname === "/reservar";
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Viborea
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {areas.map((a) => (
              <NavLink
                key={a.to}
                to={a.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`
                }
              >
                {a.label}
              </NavLink>
            ))}
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
