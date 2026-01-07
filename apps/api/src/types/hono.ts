import type { TorrentDownload, TorrentLiveData } from "@/modules/download/download.dto";
import type { User } from "@/modules/user/user.dto";

// Define Hono context variables
export type HonoVariables = {
  user: User;
  download?: TorrentDownload & { live?: TorrentLiveData };
};
