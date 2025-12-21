import { createFileRoute } from "@tanstack/react-router";
import { Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTmdb } from "@/hooks/use-tmdb";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { apiKey, updateApiKey } = useTmdb();

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application preferences and API integrations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="size-5 text-primary" />
              <CardTitle>TMDB API</CardTitle>
            </div>
            <CardDescription>
              Enter your TMDB API key to enable personalized search and detailed movie information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tmdb-api-key">API Key</Label>
              <Input
                id="tmdb-api-key"
                placeholder="Enter your TMDB API key..."
                value={apiKey || ""}
                onChange={(e) => updateApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and is never sent to our servers
                except as an Authorization header.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
