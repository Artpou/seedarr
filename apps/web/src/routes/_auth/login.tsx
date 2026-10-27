import React from "react";

import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import type { LoginInput } from "@seedarr/contracts";
import { api, unwrap } from "@seedarr/sdk";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { CircleAlertIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { useAuth } from "@/features/auth/auth-store";
import { useLogin } from "@/features/auth/hooks/auth.queries";

export const Route = createFileRoute("/_auth/login")({
  component: Login,
  beforeLoad: async () => {
    const isAuthenticated = useAuth.getState().user;
    if (isAuthenticated) throw redirect({ to: "/" });

    const data = await unwrap(api.auth["has-owner"].$get());
    if (!data.hasOwner) {
      throw redirect({ to: "/onboarding" });
    }
  },
});

function Login() {
  const navigate = useNavigate();
  const { t } = useLingui();
  const [error, setError] = React.useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>();

  const { mutate: login, isPending } = useLogin(
    () => navigate({ to: "/" }),
    (message) => setError(message || t(msg`An error occurred`)),
  );

  const onSubmit = (data: LoginInput) => {
    setError(undefined);
    login(data);
  };

  return (
    <Card className="w-full max-w-md bg-background">
      <CardHeader>
        <CardTitle>
          <Trans>Login</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={errors.username ? true : undefined} className="gap-1">
            <Input
              id="username"
              h="lg"
              autoComplete="username"
              label={<Trans>Username</Trans>}
              aria-invalid={errors.username ? true : undefined}
              {...register("username", {
                required: t(msg`Username is required`),
                minLength: { value: 3, message: t(msg`Min 3 characters`) },
              })}
            />
            <FieldError errors={[errors.username]} />
          </Field>

          <Field data-invalid={errors.password ? true : undefined} className="gap-1">
            <Input
              id="password"
              h="lg"
              password
              autoComplete="current-password"
              label={<Trans>Password</Trans>}
              aria-invalid={errors.password ? true : undefined}
              {...register("password", { required: t(msg`Password is required`) })}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
            <Trans>Login</Trans>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
