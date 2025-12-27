import { Trans } from "@lingui/react/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"jackett" | "prowlarr">("jackett");

  // Fetch indexers using React Query
  const { data: indexers = [], isLoading } = useQuery({
    queryKey: ["indexers"],
    queryFn: async () => {
      const response = await api.indexers.get();
      return response.data || [];
    },
  });

  const { mutate: upsertIndexer } = useMutation({
    mutationFn: async (data: { name: "jackett" | "prowlarr"; apiKey: string }) =>
      api.indexers.post(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indexers"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const jackettIndexer = indexers.find((i: { name: string }) => i.name === "jackett");
  const prowlarrIndexer = indexers.find((i: { name: string }) => i.name === "prowlarr");

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Trans>Settings</Trans>
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans>Manage your application preferences and API integrations.</Trans>
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="size-5" />
              <CardTitle>
                <Trans>Torrent Indexer</Trans>
              </CardTitle>
            </div>
            <CardDescription>
              <Trans>Configure your torrent indexer to search and download torrents.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={selectedTab}
              onValueChange={(v) => setSelectedTab(v as "jackett" | "prowlarr")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jackett">
                  <Trans>Jackett</Trans>
                </TabsTrigger>
                <TabsTrigger value="prowlarr">
                  <Trans>Prowlarr</Trans>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="jackett" className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="jackett-api-key"
                    placeholder="Enter your Jackett API key..."
                    label={<Trans>Jackett API Key</Trans>}
                    defaultValue={jackettIndexer?.apiKey || ""}
                    onBlur={(e) => {
                      console.log(e.target.value);
                      upsertIndexer({
                        name: "jackett",
                        apiKey: e.target.value,
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    <Trans>
                      Your Jackett API key is stored in the database and used to search torrents.
                    </Trans>
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="prowlarr" className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="prowlarr-api-key"
                    placeholder="Enter your Prowlarr API key..."
                    label={<Trans>Prowlarr API Key</Trans>}
                    defaultValue={prowlarrIndexer?.apiKey || ""}
                    onBlur={(e) => {
                      upsertIndexer({
                        name: "prowlarr",
                        apiKey: e.target.value,
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    <Trans>
                      Your Prowlarr API key is stored in the database and used to search torrents.
                    </Trans>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogOut className="size-5" />
              <CardTitle>
                <Trans>Account</Trans>
              </CardTitle>
            </div>
            <CardDescription>
              <Trans>Manage your account settings and sign out.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => authClient.signOut()} className="w-full">
              <LogOut className="mr-2 size-4" />
              <Trans>Sign Out</Trans>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
