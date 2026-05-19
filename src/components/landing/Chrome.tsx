"use client";

import Link from "next/link";
import { C, sans, mono } from "./Gauge";
import { Logo } from "./Logo";

export function LandingNav() {
  return (
    <nav
      className="fixed left-0 right-0 z-50 flex items-center justify-between"
      style={{
        top: 0,
        height: 56,
        padding: "0 28px",
        background: `${C.bg}E6`,
        borderBottom: `1px solid ${C.rule}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <Logo />
      <div className="hidden sm:flex items-center" style={{ gap: 28, fontFamily: sans, fontSize: 13, color: C.muteDeep }}>
        <a href="#methode">Méthode</a>
        <a href="#edition">Édition</a>
        <a href="#score">Lire un score</a>
        <Link href="/pricing">Tarifs</Link>
      </div>
      <div className="flex gap-2">
        <Link
          href="/login"
          style={{ padding: "6px 14px", fontFamily: sans, fontSize: 13, color: C.muteDeep, textDecoration: "none" }}
        >
          Se connecter
        </Link>
        <Link
          href="/login?mode=signup"
          style={{ padding: "7px 14px", fontFamily: sans, fontSize: 13, fontWeight: 600, background: C.phosphor, color: C.bg, borderRadius: 8, textDecoration: "none" }}
        >
          Essayer gratuitement
        </Link>
      </div>
    </nav>
  );
}

export function LandingFooter() {
  return (
    <footer
      className="flex justify-between flex-wrap"
      style={{
        borderTop: `1px solid ${C.rule}`,
        padding: "32px 40px",
        fontFamily: mono,
        fontSize: 11,
        color: C.muted,
        letterSpacing: "0.08em",
        maxWidth: 1280,
        margin: "0 auto",
        gap: 20,
      }}
    >
      <div>© 2026 ALPHABRIEF · OUTIL D&apos;AIDE À LA DÉCISION · PAS UN CONSEIL MIF II</div>
      <div className="flex gap-5">
        <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>CONNEXION</Link>
        <Link href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>TARIFS</Link>
        <a href="mailto:contact@maxloop.ovh" style={{ color: "inherit", textDecoration: "none" }}>CONTACT</a>
      </div>
    </footer>
  );
}
