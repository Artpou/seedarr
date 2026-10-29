import { Trans } from "@lingui/react/macro";
import { AlertTriangleIcon, SearchXIcon } from "lucide-react";

import { ErrorLayout } from "@/shared/components/error/error-layout";
import { getErrorMessage, isRouteForbidden, isRouteNotFound } from "@/shared/helpers/error.helper";
import { Container } from "@/shared/ui/container";

interface ErrorViewProps {
  error: Error;
  reset?: () => void;
}

export function NotFoundView() {
  return (
    <Container full>
      <ErrorLayout
        icon={SearchXIcon}
        title={<Trans>Page not found</Trans>}
        description={<Trans>The page you are looking for does not exist.</Trans>}
      />
    </Container>
  );
}

function ForbiddenView() {
  return (
    <Container full>
      <ErrorLayout
        icon={SearchXIcon}
        title={<Trans>Forbidden</Trans>}
        description={<Trans>You are not authorized to access this page.</Trans>}
      />
    </Container>
  );
}

function UnhandledView({ error, reset }: ErrorViewProps) {
  const message = getErrorMessage(error);

  return (
    <Container full>
      <ErrorLayout
        icon={AlertTriangleIcon}
        title={<Trans>Something went wrong</Trans>}
        description={<Trans>An unexpected error occurred. Please try again.</Trans>}
        onRetry={reset}
      >
        {message && (
          <div className="max-w-full rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-left sm:p-4">
            <p className="font-mono text-xs text-destructive wrap-break-word">{message}</p>
          </div>
        )}

        {error?.stack && import.meta.env.DEV && (
          <pre className="mt-2 max-h-48 max-w-full overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/10 p-3 font-mono text-[11px] leading-relaxed text-destructive wrap-break-word whitespace-pre-wrap sm:max-h-60 sm:p-4 sm:text-xs">
            <code>{error.stack}</code>
          </pre>
        )}
      </ErrorLayout>
    </Container>
  );
}

export function ErrorView({ error, reset }: ErrorViewProps) {
  if (isRouteNotFound(error)) return <NotFoundView />;
  if (isRouteForbidden(error)) return <ForbiddenView />;

  return <UnhandledView error={error} reset={reset} />;
}
