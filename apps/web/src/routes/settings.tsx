import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTmdb } from "@/hooks/use-tmdb";
import { useTorrentIndexer } from "@/hooks/use-torrent-indexer";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { apiKey, updateApiKey } = useTmdb();
  const {
    indexerType,
    setIndexerType,
    jackettApiKey,
    updateJackettApiKey,
    prowlarrApiKey,
    updateProwlarrApiKey,
  } = useTorrentIndexer();

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
              value={indexerType}
              onValueChange={(v) => setIndexerType(v as "jackett" | "prowlarr")}
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
                    value={jackettApiKey || ""}
                    onChange={(e) => updateJackettApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <Trans>
                      Your Jackett API key is stored locally and used to search torrents.
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
                    value={prowlarrApiKey || ""}
                    onChange={(e) => updateProwlarrApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <Trans>
                      Your Prowlarr API key is stored locally and used to search torrents.
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
              <Key className="size-5" />
              <CardTitle>
                <Trans>TMDB API</Trans>
              </CardTitle>
            </div>
            <CardDescription>
              <Trans>
                Enter your TMDB API key to enable personalized search and detailed movie
                information.
              </Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="tmdb-api-key"
                placeholder="Enter your TMDB API key..."
                label={<Trans>API Key</Trans>}
                value={apiKey || ""}
                onChange={(e) => updateApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                <Trans>
                  Your API key is stored locally in your browser and is never sent to our servers
                  except as an Authorization header.
                </Trans>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
