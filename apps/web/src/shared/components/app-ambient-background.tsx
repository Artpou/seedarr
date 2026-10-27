import { cn } from "@/lib/utils";

/** Fixed glow footprint (not % of page height). */
const GLOW_WIDTH = "52rem";
const GLOW_HEIGHT = "34rem";

type AppAmbientBackgroundProps = {
  /** Login / onboarding — full strength. Authenticated app — subtle. */
  variant?: "prominent" | "subtle";
  className?: string;
};

export function AppAmbientBackground({ variant = "prominent", className }: AppAmbientBackgroundProps) {
  const subtle = variant === "subtle";
  const glowAlpha = subtle ? 0.09 : 0.28;

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)} aria-hidden>
      <div
        className="absolute top-0 left-0 max-w-[100vw]"
        style={{
          width: GLOW_WIDTH,
          height: GLOW_HEIGHT,
          background: `radial-gradient(ellipse 100% 100% at 0% 0%, oklch(0.63 0.13 135 / ${glowAlpha}), transparent 68%)`,
        }}
      />
      <div
        className={cn("absolute inset-0", subtle ? "opacity-[0.07]" : "opacity-25")}
        style={{
          backgroundImage: "radial-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
