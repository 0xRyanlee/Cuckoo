import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Copy, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const MAX_STORED_ERRORS = 20;

function storeError(message: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("cuckoo_errors") || "[]");
    const timestamp = new Date().toISOString();
    existing.unshift(`[${timestamp}] ${message}`);
    if (existing.length > MAX_STORED_ERRORS) {
      existing.length = MAX_STORED_ERRORS;
    }
    localStorage.setItem("cuckoo_errors", JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    storeError(`${error.message}\n${errorInfo.componentStack}`);
    console.error("Cuckoo Error Boundary caught:", error, errorInfo);
  }

  handleCopyReport = () => {
    const { error, errorInfo } = this.state;
    const report = [
      "=== Cuckoo 崩溃报告 ===",
      `时间: ${new Date().toISOString()}`,
      `版本: 1.0.0`,
      `平台: ${navigator.platform}`,
      "",
      "--- 错误信息 ---",
      error?.toString() || "Unknown error",
      "",
      "--- 组件堆栈 ---",
      errorInfo?.componentStack || "N/A",
      "",
      "=== 报告结束 ===",
    ].join("\n");

    navigator.clipboard.writeText(report).then(() => {
      alert("报告已复制到剪贴板，请发送给开发者");
    }).catch(() => {
      // Fallback: show in prompt
      prompt("请复制以下报告发送给开发者:", report);
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-8">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                应用程序错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                抱歉，应用程序遇到了一个意外错误。请复制错误报告并发送给开发者以便修复。
              </p>

              {this.state.error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-xs font-mono text-destructive whitespace-pre-wrap">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleCopyReport} className="flex-1 gap-2">
                  <Copy className="h-4 w-4" />
                  复制错误报告
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  重新加载
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
