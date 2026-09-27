import { createFileRoute, Outlet } from "@tanstack/react-router";

import { OnboardingLayoutView } from "@/features/onboarding/onboarding-layout-view";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <OnboardingLayoutView>
      <Outlet />
    </OnboardingLayoutView>
  );
}
