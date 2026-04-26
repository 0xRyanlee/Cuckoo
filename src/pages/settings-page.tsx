import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Database, Wifi, WifiOff, Monitor, Copy, Bug, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SettingsPageProps {
  connected: boolean;
}

interface ErrorReport {
  timestamp: string;
  app_version: string;
  platform: string;
  arch: string;
  db_path: string;
  db_status: string;
  backend_status: string;
  recent_errors: string[];
  system_info: Record<string, string>;
}

export function SettingsPage({ connected }: SettingsPageProps) {
  const [errorReport, setErrorReport] = useState<ErrorReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);

  async function generateErrorReport() {
    setGenerating(true);
    try {
      const report: ErrorReport = {
        timestamp: new Date().toISOString(),
        app_version: "1.0.0",
        platform: navigator.platform,
        arch: navigator.userAgent.includes("ARM") || navigator.userAgent.includes("arm") ? "arm64" : "x64",
        db_path: "~/Library/Application Support/Cuckoo/cuckoo.db",
        db_status: "unknown",
        backend_status: connected ? "connected" : "disconnected",
        recent_errors: [],
        system_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenWidth: window.screen.width.toString(),
          screenHeight: window.screen.height.toString(),
          colorDepth: window.screen.colorDepth.toString(),
          devicePixelRatio: window.devicePixelRatio.toString(),
        },
      };

      // Try to get DB status
      try {
        const result = await invoke<string>("health_check");
        report.db_status = result === "ok" ? "healthy" : "unhealthy";
      } catch (e) {
        report.db_status = `error: ${String(e)}`;
      }

      // Collect recent errors from localStorage if any
      try {
        const storedErrors = localStorage.getItem("cuckoo_errors");
        if (storedErrors) {
          report.recent_errors = JSON.parse(storedErrors);
        }
      } catch {
        // ignore
      }

      setErrorReport(report);
      setShowReport(true);
    } catch (e) {
      toast.error("生成报告失败", { description: String(e) });
    } finally {
      setGenerating(false);
    }
  }

  function copyReport() {
    if (!errorReport) return;
    const text = [
      "=== Cuckoo 错误报告 ===",
      `生成时间: ${errorReport.timestamp}`,
      `应用版本: ${errorReport.app_version}`,
      `平台: ${errorReport.platform}`,
      `架构: ${errorReport.arch}`,
      `数据库路径: ${errorReport.db_path}`,
      `数据库状态: ${errorReport.db_status}`,
      `后端状态: ${errorReport.backend_status}`,
      "",
      "--- 系统信息 ---",
      ...Object.entries(errorReport.system_info).map(([k, v]) => `${k}: ${v}`),
      "",
      "--- 最近错误 ---",
      ...(errorReport.recent_errors.length > 0 ? errorReport.recent_errors : ["无"]),
      "",
      "=== 报告结束 ===",
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      toast.success("报告已复制到剪贴板");
    }).catch(() => {
      toast.error("复制失败");
    });
  }

  function clearErrors() {
    localStorage.removeItem("cuckoo_errors");
    toast.success("错误记录已清除");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">系统设置</h2>
        <p className="text-sm text-muted-foreground">系统信息和故障诊断</p>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">系统版本</p>
                <p className="text-xs text-muted-foreground">当前安装的版本</p>
              </div>
            </div>
            <span className="text-sm font-mono text-muted-foreground">v1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">数据库路径</p>
                <p className="text-xs text-muted-foreground">SQLite 本地存储位置</p>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">~/Library/Application Support/Cuckoo/cuckoo.db</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {connected ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">连接状态</p>
                <p className="text-xs text-muted-foreground">后端服务连接情况</p>
              </div>
            </div>
            <span className={`text-sm font-medium ${connected ? "text-emerald-500" : "text-destructive"}`}>
              {connected ? "已连接" : "未连接"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            故障诊断
          </CardTitle>
          <CardDescription>生成错误报告以协助调试问题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={generateErrorReport} disabled={generating} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {generating ? "生成中..." : "生成错误报告"}
            </Button>
            <Button variant="outline" onClick={clearErrors} className="gap-2">
              清除错误记录
            </Button>
          </div>

          {showReport && errorReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">报告预览</p>
                <Button variant="outline" size="sm" onClick={copyReport} className="gap-1">
                  <Copy className="h-3 w-3" />复制报告
                </Button>
              </div>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap font-mono">
{`=== Cuckoo 错误报告 ===
生成时间: ${errorReport.timestamp}
应用版本: ${errorReport.app_version}
平台: ${errorReport.platform}
架构: ${errorReport.arch}
数据库路径: ${errorReport.db_path}
数据库状态: ${errorReport.db_status}
后端状态: ${errorReport.backend_status}

--- 系统信息 ---
${Object.entries(errorReport.system_info).map(([k, v]) => `${k}: ${v}`).join("\n")}

--- 最近错误 ---
${errorReport.recent_errors.length > 0 ? errorReport.recent_errors.join("\n") : "无"}

=== 报告结束 ===`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
