"use client";

import { useEffect, useState } from "react";

/** A short identity sequence, once per tab session; ?intro=1 replays for recordings. */
export default function BrandIntro() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("borrow-intro") === "seen";
    } catch {}
    const replay =
      new URLSearchParams(window.location.search).get("intro") === "1";
    if (seen && !replay) return;
    try {
      sessionStorage.setItem("borrow-intro", "seen");
    } catch {}
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2050);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="brand-intro" aria-label="BORROW introduction">
      <div className="intro-registration" aria-hidden="true">
        <span>BORROW / 001</span>
        <span>ACCESS, ON YOUR TERMS.</span>
      </div>
      <div className="intro-identity" aria-hidden="true">
        <svg className="intro-symbol" viewBox="0 0 28 32" fill="none">
          <path
            d="M3 3h13l10 7-10 6 10 6-10 7H3V3Zm0 0 23 19M3 16h13M3 29 26 10"
            stroke="currentColor"
            strokeWidth="1.3"
            pathLength="1"
          />
        </svg>
        <div className="intro-name">
          {"borrow".split("").map((letter, index) => (
            <span
              key={index}
              style={{ animationDelay: `${index * 55 + 100}ms` }}
            >
              {letter}
            </span>
          ))}
          <sup>®</sup>
        </div>
        <p>Temporary access. Lasting accountability.</p>
        <div className="intro-rule">
          <span />
        </div>
      </div>
      <button className="intro-skip" onClick={() => setVisible(false)}>
        Skip introduction <span>↗</span>
      </button>
    </div>
  );
}
