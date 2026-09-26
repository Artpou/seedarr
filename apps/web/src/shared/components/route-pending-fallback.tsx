import { cn } from "@/lib/utils";
import { SeedarrLoader } from "@/shared/components/seedarr-loader";
import { Container } from "@/shared/ui/container";

type RoutePendingFallbackProps = {
  /** Full viewport (root / auth). Default keeps space inside the app shell main area. */
  variant?: "full" | "main";
};

export function RoutePendingFallback({ variant = "main" }: RoutePendingFallbackProps) {
  return (
    <Container
      full={variant === "full"}
      className={cn(variant === "main" && "flex min-h-[50dvh] items-center justify-center py-12")}
    >
      <SeedarrLoader />
    </Container>
  );
}
