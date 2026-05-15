import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, Download, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

export interface UpdateInfo {
  current_version: string;
  new_version: string;
  release_notes: string;
  download_url: string;
  release_url: string;
}

type Phase = "idle" | "downloading" | "done" | "error";

interface Props {
  info: UpdateInfo;
  onDismiss: () => void;
}

export function UpdateDialog({ info, onDismiss }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const unlistenRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => unlistenRef.current.forEach((u) => u());
  }, []);

  async function handleUpdate() {
    setPhase("downloading");
    setProgress(0);

    const unlisteners: (() => void)[] = [];

    const ulProgress = await listen<{ downloaded: number; total: number }>(
      "update-progress",
      (e) => {
        const { downloaded, total } = e.payload;
        if (total > 0) setProgress(Math.round((downloaded / total) * 100));
      }
    );
    unlisteners.push(ulProgress);

    const ulDone = await listen("update-complete", () => {
      setPhase("done");
      unlisteners.forEach((u) => u());
    });
    unlisteners.push(ulDone);

    const ulErr = await listen<string>("update-error", (e) => {
      setErrorMsg(e.payload);
      setPhase("error");
      unlisteners.forEach((u) => u());
    });
    unlisteners.push(ulErr);

    unlistenRef.current = unlisteners;

    try {
      await invoke("download_and_open_update", { url: info.download_url });
    } catch (e) {
      setErrorMsg(String(e));
      setPhase("error");
      unlisteners.forEach((u) => u());
    }
  }

  function handleSkip() {
    localStorage.setItem("cuckoo_skipped_version", info.new_version);
    onDismiss();
  }

  const notes = info.release_notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);

  return (
    <Dialog open onOpenChange={(o) => { if (!o && phase === "idle") onDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            发现新版本
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Version badges */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono">v{info.current_version}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="default" className="font-mono">v{info.new_version}</Badge>
          </div>

          {/* Release notes */}
          {notes.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 max-h-40 overflow-y-auto">
              {notes.map((line, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          )}

          {/* Progress states */}
          {phase === "downloading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  正在下载...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {phase === "done" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              下载完成！安装程序已自动打开，请按提示完成安装。
            </div>
          )}

          {phase === "error" && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">下载失败</p>
                <p className="mt-0.5 text-xs opacity-80">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {phase === "idle" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleSkip}>跳过此版本</Button>
              <Button variant="outline" size="sm" onClick={onDismiss}>稍后提醒</Button>
              <Button onClick={handleUpdate}>
                <Download className="mr-2 h-4 w-4" />立即更新
              </Button>
            </>
          )}
          {phase === "downloading" && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />下载中...
            </Button>
          )}
          {phase === "done" && (
            <Button onClick={onDismiss}>
              <CheckCircle2 className="mr-2 h-4 w-4" />关闭
            </Button>
          )}
          {phase === "error" && (
            <>
              <a
                href={info.release_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ExternalLink className="h-3 w-3" />手动下载
              </a>
              <Button onClick={handleUpdate}>重试</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
