import { cn } from "@/lib/utils";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  full?: boolean;
}

export function Container({ children, className, full = false }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        "container mx-auto px-3 sm:p-6 space-y-2 sm:space-y-8",
        full &&
          "flex w-full min-h-[100dvh] flex-col items-center justify-center overflow-y-auto px-3 py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:py-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
