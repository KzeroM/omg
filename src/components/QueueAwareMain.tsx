"use client";

import { usePlayer } from "@/context/PlayerContext";
import type { ReactNode } from "react";

export function QueueAwareMain({ children }: { children: ReactNode }) {
  const { queueOpen } = usePlayer();
  return (
    <main
      className={`flex-1 overflow-auto pb-36 transition-[padding] duration-300 ease-in-out lg:pb-24 ${
        queueOpen ? "lg:pr-80" : ""
      }`}
    >
      {children}
    </main>
  );
}
