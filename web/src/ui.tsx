import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const styles = {
    solid: "bg-stone-900 text-white hover:bg-stone-800",
    outline: "border border-stone-300 bg-white hover:bg-stone-50",
    ghost: "text-stone-700 hover:bg-stone-100",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white p-5 shadow-sm", className)}>{children}</div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none ring-stone-400 focus:ring-2"
      {...props}
    />
  );
}

export function Badge({ children, tone = "stone" }: { children: ReactNode; tone?: "stone" | "amber" | "teal" | "red" }) {
  const styles = {
    stone: "bg-stone-100 text-stone-700",
    amber: "bg-amber-100 text-amber-800",
    teal: "bg-teal-100 text-teal-800",
    red: "bg-red-100 text-red-800",
  }[tone];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", styles)}>{children}</span>;
}
