import { useEffect, useMemo, useRef, useState } from "react";
import { FlagImage, defaultCountries, parseCountry } from "react-international-phone";
import { phoneIssue } from "./phone";

const COUNTRIES = defaultCountries.map(parseCountry);
const PREFERRED = ["py", "ar", "es", "br", "us"];
function guessCountry(): string {
  const lang = navigator.language || "";
  const m = lang.split("-")[1];
  if (m && m.length === 2) return m.toLowerCase();
  return "py";
}

function matchCountry(c: { name: string; iso2: string; dialCode: string }, q: string) {
  const s = q.trim().toLowerCase().replace(/^\+/, "");
  if (!s) return true;
  return (
    c.name.toLowerCase().includes(s) ||
    c.iso2.includes(s) ||
    c.dialCode.includes(s) ||
    `+${c.dialCode}`.includes(q.trim().toLowerCase())
  );
}

export function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [iso2, setIso2] = useState(guessCountry());
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const country = COUNTRIES.find((c) => c.iso2 === iso2) ?? COUNTRIES.find((c) => c.iso2 === "py")!;

  useEffect(() => {
    const ac = new AbortController();
    fetch("https://ipwho.is/?fields=country_code", { signal: ac.signal })
      .then((r) => r.json())
      .then((d: { country_code?: string }) => {
        if (d.country_code && d.country_code.length === 2) setIso2(d.country_code.toLowerCase());
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const national = value.startsWith(`+${country.dialCode}`)
    ? value.slice(country.dialCode.length + 1)
    : value.replace(/^\+\d+/, "");

  const filtered = useMemo(() => {
    const list = COUNTRIES.filter((c) => matchCountry(c, q));
    const pref = list.filter((c) => PREFERRED.includes(c.iso2));
    const rest = list.filter((c) => !PREFERRED.includes(c.iso2));
    return q.trim() ? list : [...pref, ...rest];
  }, [q]);

  function selectCountry(nextIso: string) {
    const next = COUNTRIES.find((c) => c.iso2 === nextIso);
    if (!next) return;
    setIso2(nextIso);
    setOpen(false);
    setQ("");
    const rest = national.replace(/\D/g, "");
    onChange(rest ? `+${next.dialCode}${rest}` : `+${next.dialCode}`);
  }

  function onNational(raw: string) {
    const rest = raw.replace(/\D/g, "");
    onChange(rest ? `+${country.dialCode}${rest}` : `+${country.dialCode}`);
  }

  const issue = phoneIssue(value);
  const dirty = /\d/.test(national);
  const bad = dirty && issue;

  return (
    <div>
      <div
        ref={root}
        className={`relative flex h-10 overflow-visible rounded-md border bg-white ${bad ? "border-red-500" : "border-stone-300"}`}
      >
        <button
          type="button"
          className="flex h-10 items-center gap-1 border-r border-stone-200 px-2 text-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="País"
        >
          <FlagImage iso2={country.iso2} size={18} />
          <span className="text-stone-600">+{country.dialCode}</span>
        </button>
        <input
          className="h-10 min-w-0 flex-1 px-3 text-sm outline-none"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(e) => onNational(e.target.value)}
          placeholder="981 123 456"
          aria-invalid={Boolean(bad)}
        />
        {open ? (
          <div className="absolute top-11 left-0 z-30 w-72 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
            <input
              ref={searchRef}
              className="h-10 w-full border-b border-stone-200 px-3 text-sm outline-none"
              placeholder="País o prefijo (Paraguay, 595…)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((c) => (
                <li key={c.iso2}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-stone-50"
                    onClick={() => selectCountry(c.iso2)}
                  >
                    <FlagImage iso2={c.iso2} size={18} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-stone-400">+{c.dialCode}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 ? <li className="px-3 py-2 text-sm text-stone-500">Nada coincide.</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
      {bad ? <p className="mt-1 text-xs text-red-700">{issue}</p> : null}
    </div>
  );
}
