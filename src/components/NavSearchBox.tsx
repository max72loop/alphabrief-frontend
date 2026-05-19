"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NavSearchBox() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const submit = (e: FormEvent) => {
    const t = value.trim();
    if (!t) {
      e.preventDefault();
      return;
    }
    // Client-side enhancement : utilise router.push pour ne pas recharger la page.
    // Si la page /search n'est pas atteinte (JS désactivé / erreur d'hydratation),
    // le navigateur soumet le formulaire vers action="/search" comme fallback.
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(t)}`);
    setValue("");
    inputRef.current?.blur();
  };

  const borderColor = focused ? "#7EE5A360" : "#1A2520";
  const bg = focused ? "#13201A" : "#0E1511";

  return (
    <form
      onSubmit={submit}
      action="/search"
      method="get"
      role="search"
      className="hidden md:flex flex-1 max-w-[420px] items-center gap-2.5 ml-2"
      style={{
        padding: "7px 12px",
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        transition: "border 0.15s, background 0.15s",
      }}
    >
      <span
        style={{
          color: focused ? "#7EE5A3" : "#6D7A72",
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: 12,
        }}
      >
        ›
      </span>
      <input
        ref={inputRef}
        name="q"
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Scorer un ticker, une entreprise…"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#F0EBDB",
          fontFamily: "var(--font-inter-tight), -apple-system, system-ui, sans-serif",
          fontSize: 13,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: 10,
          color: "#6D7A72",
          letterSpacing: "0.08em",
          padding: "2px 6px",
          border: "1px solid #1A2520",
          borderRadius: 3,
        }}
      >
        ⌘K
      </span>
    </form>
  );
}
