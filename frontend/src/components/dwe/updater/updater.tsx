import { useContext, useEffect, useRef, useState } from "react";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import FeaturesContext from "@/contexts/FeaturesContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import NotConnected from "../not-connected";
import FeatureNotSupported from "../app/not-supported";
import { Markdown } from "../markdown";

import { version } from "../../../../package.json";

type Release = components["schemas"]["ReleaseModel"];
type UpdateStatus = components["schemas"]["UpdateStatusModel"];

const STATUS_POLL_INTERVAL = 1000;
// Older releases are hidden until asked for, most people want a recent one
const RECENT_RELEASE_COUNT = 5;

const UPDATER_NOT_SUPPORTED_MSG = `
The updater is not currently enabled in the backend.

- If you installed dweOS yourself, please enable it by removing \`--no-updater\`.
- If you have installed dweOS as an extension on BlueOS, please update it from the BlueOS extensions manager.
`.trim();

// Preview builds are versioned <version>-pr<number>.<sha> and tagged
// preview-pr-<number>
const installedTag = (() => {
  const preview = version.match(/-pr(\d+)\./);
  return preview ? `preview-pr-${preview[1]}` : version;
})();

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString() : "";

const ReleaseRow = ({
  release,
  isLatest,
  disabled,
  onInstall,
}: {
  release: Release;
  isLatest: boolean;
  disabled: boolean;
  onInstall: (release: Release) => void;
}) => {
  const installed = release.tag === installedTag;

  return (
    <AccordionItem
      value={release.tag}
      className="rounded-none border-b last:border-b-0"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <AccordionTrigger className="gap-4 px-2 py-3">
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium">{release.name}</span>
              {isLatest && <Badge>Latest</Badge>}
              {installed && <Badge variant="success">Installed</Badge>}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatDate(release.published_at)}
            </span>
          </AccordionTrigger>
        </div>
        <Button
          size="sm"
          variant={installed ? "ghost" : "outline"}
          className="w-24 shrink-0"
          disabled={disabled}
          onClick={() => onInstall(release)}
        >
          {installed ? "Reinstall" : "Install"}
        </Button>
      </div>
      <AccordionContent className="px-2">
        {release.notes ? (
          // Release notes hold long install commands, wrap them in the card
          <div className="min-w-0 break-words [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs">
            <Markdown>{release.notes}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No release notes.</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export const Updater = () => {
  const { connected } = useContext(WebsocketContext)!;
  const features = useContext(FeaturesContext);

  const [releases, setReleases] = useState<Release[] | null>(null);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [showPrereleases, setShowPrereleases] = useState(false);
  const [showAllReleases, setShowAllReleases] = useState(false);
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [pendingRelease, setPendingRelease] = useState<Release | null>(null);
  // Set once the backend goes down for the update, so the page reloads into
  // the new version when it comes back
  const restarting = useRef(false);
  const logRef = useRef<HTMLPreElement>(null);

  const updating = status?.state === "running";

  const fetchReleases = async () => {
    setLoadingReleases(true);
    setReleasesError(null);
    const { data, error } = await API_CLIENT.GET("/api/updater/releases");
    if (data) {
      setReleases(data);
    } else {
      setReleasesError(
        (error as { detail?: string } | undefined)?.detail ??
          "Failed to fetch releases",
      );
    }
    setLoadingReleases(false);
  };

  const fetchStatus = async () => {
    const { data } = await API_CLIENT.GET("/api/updater/status");
    if (data) setStatus(data);
  };

  useEffect(() => {
    if (connected && features?.updater) {
      if (restarting.current) {
        window.location.reload();
        return;
      }
      fetchReleases();
      fetchStatus();
    }
  }, [connected, features?.updater]);

  useEffect(() => {
    if (!updating) return;
    if (!connected) {
      restarting.current = true;
      return;
    }
    const interval = setInterval(fetchStatus, STATUS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [updating, connected]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [status?.log]);

  const installRelease = async (release: Release) => {
    setPendingRelease(null);
    const { error } = await API_CLIENT.POST("/api/updater/install", {
      body: { tag: release.tag },
    });
    if (error) {
      toast.error(
        (error as { detail?: string }).detail ?? "Failed to start the update",
      );
      return;
    }
    toast.info(`Updating dweOS to ${release.tag}...`);
    fetchStatus();
  };

  if (!connected && !updating) return <NotConnected />;

  if (features && !features.updater) {
    return (
      <FeatureNotSupported>
        <Markdown>{UPDATER_NOT_SUPPORTED_MSG}</Markdown>
      </FeatureNotSupported>
    );
  }

  const filteredReleases = (releases ?? []).filter(
    (release) => showPrereleases || !release.prerelease,
  );
  const visibleReleases = showAllReleases
    ? filteredReleases
    : filteredReleases.slice(0, RECENT_RELEASE_COUNT);
  const latest = releases?.find((release) => !release.prerelease);
  const updateAvailable = latest && latest.tag !== installedTag;

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <Card>
        <CardHeader>
          <CardTitle>dweOS {version}</CardTitle>
          <CardDescription>
            {latest
              ? updateAvailable
                ? `${latest.tag} is available.`
                : "You are on the latest release."
              : "Checking for updates..."}
          </CardDescription>
        </CardHeader>
        {updateAvailable && (
          <CardContent>
            <Button
              disabled={updating}
              onClick={() => setPendingRelease(latest)}
            >
              <DownloadIcon />
              Update to {latest.tag}
            </Button>
          </CardContent>
        )}
      </Card>

      {status && status.state !== "idle" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {updating ? (
                <>
                  <Spinner />
                  {connected ? "Updating" : "Restarting dweOS"}
                </>
              ) : (
                <span className="text-destructive">Update failed</span>
              )}
            </CardTitle>
            <CardDescription>
              {updating
                ? "Do not power off the device. The page will reload when the update finishes."
                : "dweOS was not updated. The output of the update is below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre
              ref={logRef}
              className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all"
            >
              {status.log}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <CardTitle>Releases</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-prereleases"
                checked={showPrereleases}
                onCheckedChange={setShowPrereleases}
              />
              <Label htmlFor="show-prereleases">Show pre-releases</Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={loadingReleases}
              onClick={fetchReleases}
            >
              <RefreshCwIcon
                className={loadingReleases ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {releasesError ? (
            <p className="text-sm text-destructive">{releasesError}</p>
          ) : !releases ? (
            <Spinner />
          ) : filteredReleases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No releases found.</p>
          ) : (
            <Accordion type="single" collapsible>
              {visibleReleases.map((release) => (
                <ReleaseRow
                  key={release.tag}
                  release={release}
                  isLatest={release.tag === latest?.tag}
                  disabled={updating}
                  onInstall={setPendingRelease}
                />
              ))}
            </Accordion>
          )}
          {filteredReleases.length > RECENT_RELEASE_COUNT && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-muted-foreground"
              onClick={() => setShowAllReleases(!showAllReleases)}
            >
              {showAllReleases
                ? "Show fewer releases"
                : `Show ${filteredReleases.length - RECENT_RELEASE_COUNT} older releases`}
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingRelease !== null}
        onOpenChange={(open) => !open && setPendingRelease(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Install {pendingRelease?.tag}?</AlertDialogTitle>
            <AlertDialogDescription>
              dweOS will download and install {pendingRelease?.tag}, then
              restart. Streams and recordings will stop while it restarts.
              Camera settings and preferences are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingRelease && installRelease(pendingRelease)}
            >
              Install
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Updater;
