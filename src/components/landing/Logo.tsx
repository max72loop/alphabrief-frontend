"use client";

import Link from "next/link";

export function Logo({ size = "base" }: { size?: "base" | "lg" }) {
  const big = size === "lg";
  return (
    <Link href="/" className="select-none inline-flex items-baseline" style={{ letterSpacing: "-0.02em" }}>
      <span
        className="text-[#7EE5A3]"
        style={{
          fontFamily: "var(--font-fraunces)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: big ? 40 : 22,
          lineHeight: 1,
        }}
      >
        α
      </span>
      <span
        className="text-[#F0EBDB] font-bold"
        style={{ fontSize: big ? 32 : 18, letterSpacing: "-0.02em" }}
      >
        lpha
      </span>
      <span
        className="text-[#F0EBDB] font-medium ml-[2px]"
        style={{ fontSize: big ? 32 : 18, letterSpacing: "-0.02em" }}
      >
        Brief
      </span>
    </Link>
  );
}
