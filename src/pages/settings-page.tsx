import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Database, Wifi, WifiOff, Monitor, Plus, Pencil, Trash2, Scan, TestTube2, History, Printer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface PrinterConfig {
  id: number;
  name: string;
  printer_type: string;
  connection_type: string;
  feie_user: string | null;
  feie_ukey: string | null;
  feie_sn: string | null;
  feie_key: string | null;
  lan_ip: string | null;
  lan_port: number;
  paper_width: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LanPrinter {
  ip: string;
  port: number;
  sn: string | null;
}

interface PrintTask {
  id: number;
  task_type: string;
  ref_type: string | null;
  ref_id: number | null;
  content: string;
  status: string;
  printer_id: number | null;
  printer_name: string | null;
  created_at: string;
  printed_at: string | null;
  error_msg: string | null;
}

interface SettingsPageProps {
  connected: boolean;
}

export function SettingsPage({ connected }: SettingsPageProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [printTasks, setPrintTasks] = useState<PrintTask[]>([]);
  const [lanPrinters, setLanPrinters] = useState<LanPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanSubnet, setScanSubnet] = useState("192.168.1");
  const [error, setError] = useState<string | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PrinterConfig | null>(null);

  const [newPrinterName, setNewPrinterName] = useState("");
  const [newPrinterType, setNewPrinterType] = useState("thermal");
  const [newConnectionType, setNewConnectionType] = useState("feie");
  const [newFeieUser, setNewFeieUser] = useState("");
  const [newFeieUkey, setNewFeieUkey] = useState("");
  const [newFeieSn, setNewFeieSn] = useState("");
  const [newFeieKey, setNewFeieKey] = useState("");
  const [newLanIp, setNewLanIp] = useState("");
  const [newLanPort, setNewLanPort] = useState("9100");
  const [newPaperWidth, setNewPaperWidth] = useState("80mm");
  const [newIsDefault, setNewIsDefault] = useState(false);

  const [editPrinter, setEditPrinter] = useState<PrinterConfig | null>(null);
  const [testPrinter, setTestPrinter] = useState<PrinterConfig | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  async function loadPrinters() {
    try {
      const data = await invoke<PrinterConfig[]>("get_printers");
      setPrinters(data);
    } catch (e) { console.error(e); }
  }

  async function loadPrintTasks() {
    try {
      const data = await invoke<PrintTask[]>("get_print_tasks", { limit: 20 });
      setPrintTasks(data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadPrinters(); loadPrintTasks(); }, []);

  async function handleAddPrinter() {
    try {
      await invoke("create_printer", {
        req: {
          name: newPrinterName,
          printer_type: newPrinterType,
          connection_type: newConnectionType,
          feie_user: newFeieUser || null,
          feie_ukey: newFeieUkey || null,
          feie_sn: newFeieSn || null,
          feie_key: newFeieKey || null,
          lan_ip: newLanIp || null,
          lan_port: parseInt(newLanPort) || 9100,
          paper_width: newPaperWidth,
          is_default: newIsDefault,
        },
      });
      setAddDialogOpen(false);
      resetAddForm();
      loadPrinters();
    } catch (e) { setError(String(e)); }
  }

  async function handleEditPrinter() {
    if (!editPrinter) return;
    try {
      await invoke("update_printer", {
        id: editPrinter.id,
        name: editPrinter.name,
        printerType: editPrinter.printer_type,
        connectionType: editPrinter.connection_type,
        feieUser: editPrinter.feie_user,
        feieUkey: editPrinter.feie_ukey,
        feieSn: editPrinter.feie_sn,
        feieKey: editPrinter.feie_key,
        lanIp: editPrinter.lan_ip,
        lanPort: editPrinter.lan_port,
        paperWidth: editPrinter.paper_width,
        isDefault: editPrinter.is_default,
      });
      setEditDialogOpen(false);
      loadPrinters();
    } catch (e) { setError(String(e)); }
  }

  async function handleDeletePrinter() {
    if (!deleteConfirm) return;
    try {
      await invoke("delete_printer", { id: deleteConfirm.id });
      setDeleteConfirm(null);
      loadPrinters();
    } catch (e) { setError(String(e)); }
  }

  async function handleTestPrinter() {
    if (!testPrinter) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      if (testPrinter.connection_type === "feie") {
        const result = await invoke<string>("test_feie_printer", {
          user: testPrinter.feie_user,
          ukey: testPrinter.feie_ukey,
          sn: testPrinter.feie_sn,
        });
        setTestResult(result);
      } else {
        const result = await invoke<string>("test_lan_printer", {
          ip: testPrinter.lan_ip,
          port: testPrinter.lan_port,
        });
        setTestResult(result);
      }
    } catch (e) {
      setTestResult(String(e));
    } finally {
      setTestLoading(false);
    }
  }

  async function handleScanLan() {
    setScanning(true);
    setLanPrinters([]);
    try {
      const result = await invoke<LanPrinter[]>("scan_lan_printers", {
        subnet: scanSubnet,
        timeoutMs: 500,
      });
      setLanPrinters(result);
    } catch (e) { console.error(e); } finally {
      setScanning(false);
    }
  }

  function resetAddForm() {
    setNewPrinterName("");
    setNewPrinterType("thermal");
    setNewConnectionType("feie");
    setNewFeieUser("");
    setNewFeieUkey("");
    setNewFeieSn("");
    setNewFeieKey("");
    setNewLanIp("");
    setNewLanPort("9100");
    setNewPaperWidth("80mm");
    setNewIsDefault(false);
  }

  function openAddDialog() {
    resetAddForm();
    setAddDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">系统设置</h2>
        <p className="text-sm text-muted-foreground">管理系统配置和打印机</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">关闭</button>
        </div>
      )}

      <Tabs defaultValue="printers">
        <TabsList>
          <TabsTrigger value="system">系统信息</TabsTrigger>
          <TabsTrigger value="printers">打印机管理</TabsTrigger>
          <TabsTrigger value="tasks">打印任务</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
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
                <span className="text-sm font-mono text-muted-foreground">v0.5.0</span>
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
        </TabsContent>

        <TabsContent value="printers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">打印机列表</h3>
              <p className="text-sm text-muted-foreground">共 {printers.length} 台打印机</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />新增打印机
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {printers.length === 0 ? (
                <EmptyState icon={Printer} title="暂无打印机" description="点击新增打印机添加" action={<Button variant="outline" onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" />新增打印机</Button>} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>连接方式</TableHead>
                      <TableHead>纸张</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name}
                          {p.is_default && <Badge variant="default" className="ml-2 text-xs">默认</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.printer_type === "thermal" ? "热敏小票" : "标签"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.connection_type === "feie" ? (
                            <span>飞鹅云 ({p.feie_sn})</span>
                          ) : (
                            <span>局域网 ({p.lan_ip}:{p.lan_port})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{p.paper_width}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "secondary"}>
                            {p.is_active ? "启用" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTestPrinter(p); setTestResult(null); setTestDialogOpen(true); }}>
                              <TestTube2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPrinter(p); setEditDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                局域網掃描
              </CardTitle>
              <CardDescription>扫描局域网内 TCP 9100 端口的打印机</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={scanSubnet} onChange={(e) => setScanSubnet(e.target.value)} placeholder="192.168.1" className="max-w-[200px]" />
                <span className="flex items-center text-sm text-muted-foreground">.1 - .254</span>
                <Button onClick={handleScanLan} disabled={scanning}>
                  <Scan className="mr-2 h-4 w-4" />
                  {scanning ? "扫描中..." : "开始扫描"}
                </Button>
              </div>
              {lanPrinters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">发现 {lanPrinters.length} 台打印机</p>
                  {lanPrinters.map((lp, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{lp.ip}:{lp.port}</span>
                      <Button size="sm" variant="outline" onClick={() => { setNewLanIp(lp.ip); openAddDialog(); setNewConnectionType("lan"); }}>
                        <Plus className="mr-1 h-3 w-3" />添加
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">打印任务历史</h3>
              <p className="text-sm text-muted-foreground">最近 20 条打印任务</p>
            </div>
            <Button variant="outline" onClick={loadPrintTasks}>
              <History className="mr-2 h-4 w-4" />刷新
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {printTasks.length === 0 ? (
                <EmptyState icon={Printer} title="暂无打印任务" description="打印任务记录将在此显示" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>類型</TableHead>
                      <TableHead>打印機</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>打印时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printTasks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {t.task_type === "kitchen_ticket" ? "厨房单" : t.task_type === "batch_label" ? "批次标签" : t.task_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{t.printer_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "printed" ? "default" : t.status === "failed" ? "destructive" : "secondary"}>
                            {t.status === "printed" ? "已打印" : t.status === "failed" ? "失败" : "待打印"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.created_at}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.printed_at || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增打印机</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>打印机名称</Label>
              <Input value={newPrinterName} onChange={(e) => setNewPrinterName(e.target.value)} placeholder="如：前台小票机" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>打印机类型</Label>
                <Select value={newPrinterType} onValueChange={setNewPrinterType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">热敏小票机</SelectItem>
                    <SelectItem value="label">标签打印机</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>连接方式</Label>
                <Select value={newConnectionType} onValueChange={setNewConnectionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feie">飞鹅云打印</SelectItem>
                    <SelectItem value="lan">局域网 TCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newConnectionType === "feie" && (
              <>
                <Separator />
                <p className="text-sm font-medium">飛鵝雲配置</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>USER</Label>
                    <Input value={newFeieUser} onChange={(e) => setNewFeieUser(e.target.value)} placeholder="飞鹅用户名" />
                  </div>
                  <div className="space-y-2">
                    <Label>UKEY</Label>
                    <Input value={newFeieUkey} onChange={(e) => setNewFeieUkey(e.target.value)} placeholder="飞鹅 UKEY" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>打印机 SN</Label>
                    <Input value={newFeieSn} onChange={(e) => setNewFeieSn(e.target.value)} placeholder="打印机序列号" />
                  </div>
                  <div className="space-y-2">
                    <Label>打印机 KEY</Label>
                    <Input value={newFeieKey} onChange={(e) => setNewFeieKey(e.target.value)} placeholder="打印机 KEY" />
                  </div>
                </div>
              </>
            )}

            {newConnectionType === "lan" && (
              <>
                <Separator />
                <p className="text-sm font-medium">局域網配置</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>IP 地址</Label>
                    <Input value={newLanIp} onChange={(e) => setNewLanIp(e.target.value)} placeholder="192.168.1.100" />
                  </div>
                  <div className="space-y-2">
                    <Label>端口</Label>
                    <Input value={newLanPort} onChange={(e) => setNewLanPort(e.target.value)} placeholder="9100" />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>紙張寬度</Label>
                <Select value={newPaperWidth} onValueChange={setNewPaperWidth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={newIsDefault} onCheckedChange={(checked) => setNewIsDefault(checked === true)} />
                  設為默認打印機
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddPrinter}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑打印机</DialogTitle>
          </DialogHeader>
          {editPrinter && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>打印机名称</Label>
                <Input value={editPrinter.name} onChange={(e) => setEditPrinter({ ...editPrinter, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>打印机类型</Label>
                  <Select value={editPrinter.printer_type} onValueChange={(v) => setEditPrinter({ ...editPrinter, printer_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal">热敏小票机</SelectItem>
                      <SelectItem value="label">标签打印机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>连接方式</Label>
                  <Select value={editPrinter.connection_type} onValueChange={(v) => setEditPrinter({ ...editPrinter, connection_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feie">飞鹅云打印</SelectItem>
                      <SelectItem value="lan">局域网 TCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editPrinter.connection_type === "feie" && (
                <>
                  <Separator />
                <p className="text-sm font-medium">飞鹅云配置</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>USER</Label>
                      <Input value={editPrinter.feie_user || ""} onChange={(e) => setEditPrinter({ ...editPrinter, feie_user: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>UKEY</Label>
                      <Input value={editPrinter.feie_ukey || ""} onChange={(e) => setEditPrinter({ ...editPrinter, feie_ukey: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>打印机 SN</Label>
                      <Input value={editPrinter.feie_sn || ""} onChange={(e) => setEditPrinter({ ...editPrinter, feie_sn: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>打印机 KEY</Label>
                      <Input value={editPrinter.feie_key || ""} onChange={(e) => setEditPrinter({ ...editPrinter, feie_key: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {editPrinter.connection_type === "lan" && (
                <>
                  <Separator />
                <p className="text-sm font-medium">局域网配置</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>IP 地址</Label>
                      <Input value={editPrinter.lan_ip || ""} onChange={(e) => setEditPrinter({ ...editPrinter, lan_ip: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>端口</Label>
                      <Input value={editPrinter.lan_port.toString()} onChange={(e) => setEditPrinter({ ...editPrinter, lan_port: parseInt(e.target.value) || 9100 })} />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>纸张宽度</Label>
                  <Select value={editPrinter.paper_width} onValueChange={(v) => setEditPrinter({ ...editPrinter, paper_width: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={editPrinter.is_default} onCheckedChange={(checked) => setEditPrinter({ ...editPrinter, is_default: checked === true })} />
                  设为默认打印机
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEditPrinter}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>测试打印 - {testPrinter?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              将发送测试页到 {testPrinter?.connection_type === "feie" ? `飞鹅云 (${testPrinter?.feie_sn})` : `局域网 (${testPrinter?.lan_ip}:${testPrinter?.lan_port})`}
            </p>
            {testResult && (
              <div className={`rounded-md p-3 text-sm ${testResult.includes("ok") || testResult.includes("成功") ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                {testResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>关闭</Button>
            <Button onClick={handleTestPrinter} disabled={testLoading}>
              <TestTube2 className="mr-2 h-4 w-4" />
              {testLoading ? "發送中..." : "發送測試頁"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            确定要删除打印机「{deleteConfirm?.name}」吗？
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDeletePrinter}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
