"use client";

import { GardenProvider } from "@/lib/garden-context";
import { PointerProvider } from "@/lib/use-pointer";
import { GardenExperience } from "@/components/garden/GardenExperience";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-cream">
      <PointerProvider>
        <GardenProvider>
          <GardenExperience />
        </GardenProvider>
      </PointerProvider>
    </main>
  );
}
