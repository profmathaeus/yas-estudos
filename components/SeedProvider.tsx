"use client";

import { useEffect } from "react";
import { runSeedIfNeeded } from "@/lib/seed";

export function SeedProvider() {
  useEffect(() => {
    runSeedIfNeeded();
  }, []);
  return null;
}
