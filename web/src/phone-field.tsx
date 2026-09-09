import { useEffect, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

function guessCountry(): string {
  const lang = navigator.language || "";
  const m = lang.split("-")[1];
  if (m && m.length === 2) return m.toLowerCase();
  return "py";
}

export function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [country, setCountry] = useState(guessCountry());

  useEffect(() => {
    const ac = new AbortController();
    fetch("https://ipwho.is/?fields=country_code", { signal: ac.signal })
      .then((r) => r.json())
      .then((d: { country_code?: string }) => {
        if (d.country_code && d.country_code.length === 2) setCountry(d.country_code.toLowerCase());
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, []);

  return (
    <PhoneInput
      defaultCountry={country}
      value={value}
      onChange={onChange}
      className="phone-field"
    />
  );
}
