import { useState } from "react";

import { api, unwrap } from "@seedarr/sdk";
import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import ms from "ms";

import { useAuth } from "@/features/auth/auth-store";
import { OnboardingAccountView } from "@/features/onboarding/onboarding-account-view";
import { OnboardingIndexersView } from "@/features/onboarding/onboarding-indexers-view";
import { OnboardingLayoutView } from "@/features/onboarding/onboarding-layout-view";
import { OnboardingMemberView } from "@/features/onboarding/onboarding-member-view";
import { OnboardingStepper } from "@/features/onboarding/onboarding-stepper";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context }) => {
    const { hasOwner } = await unwrap(api.auth["has-owner"].$get());

    try {
      const user = await context.queryClient.ensureQueryData({
        queryKey: ["auth", "me"],
        queryFn: () => unwrap(api.auth.me.$get()),
        staleTime: ms("5m"),
      });
      useAuth.getState().setUser(user);

      if (user.onboarded) {
        throw redirect({ to: "/" });
      }

      return { user, hasOwner: true };
    } catch (err) {
      if (isRedirect(err)) throw err;

      useAuth.getState().setUser(null);
      context.queryClient.removeQueries({ queryKey: ["auth", "me"] });

      if (hasOwner) {
        throw redirect({ to: "/login" });
      }

      return { user: null, hasOwner: false };
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const user = useAuth((s) => s.user);
  const isOwner = !user || user.role === "owner";

  return <OnboardingLayoutView>{isOwner ? <OwnerOnboarding /> : <OnboardingMemberView />}</OnboardingLayoutView>;
}

function OwnerOnboarding() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-8">
      <OnboardingStepper currentStep={step} />

      {step === 0 && <OnboardingAccountView onContinue={() => setStep(1)} />}
      {step === 1 && <OnboardingIndexersView onBack={() => setStep(0)} />}
    </div>
  );
}
