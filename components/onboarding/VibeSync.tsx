"use client";

/**
 * VibeSync — Syncs identity.vibe to a data-vibe attribute on <html>
 * Allows global CSS variables to change per vibe theme,
 * affecting colors, glows, and atmosphere throughout the entire app.
 */
import { useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";

export function VibeSync() {
  const { identity, hydrated } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    const vibe = identity.vibe || "cozy";
    document.documentElement.setAttribute("data-vibe", vibe);
    return () => {
      // Keep vibe applied globally even after unmount
    };
  }, [identity.vibe, hydrated]);

  return null;
}
