import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import { Printer, Copy, Settings, FileText, Tag, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { PrintTicketType } from "../types";
interface DebugPrintResult {
  file_path: string;
  html_preview: string;
  byte_count: number;
}

export function PrintCenterPage() {
  const [activeTab, setActiveTab] = useState("preview");
  const [ticketTypes, setTicketTypes] = useState<PrintTicketType[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | null>(null);
  const [result, setResult] = useState<DebugPrintResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<PrintTicketType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const tts = await invoke<PrintTicketType[]>("get_print_ticket_types");
      setTicketTypes(tts.filter(t => t.is_active));
      
      const defaultTt = tts.find(t => t.is_default);
      if (defaultTt) setSelectedTicketTypeId(defaultTt.id);
    } catch (e) {
      toast.error("加載失敗", { description: String(e) });
    }
  }

  const selectedTicketType = ticketTypes.find(t => t.id === selectedTicketTypeId);

  const [orderNo, setOrderNo] = useState("ORD20260426001");
  const [dineType, setDineType] = useState("堂食");
  const [ticketNote, setTicketNote] = useState("");
  const [itemsJson, setItemsJson] = useState(`[
  ["宮保雞丁", 2, "少辣"],
  ["麻婆豆腐", 1, null],
  ["酸菜魚", 1, "加辣"]
]`);

  const [lotNo, setLotNo] = useState("LOT20260426001");
  const [materialName, setMaterialName] = useState("雞胸肉");
  const [quantity, setQuantity] = useState("10.5");
  const [unit, setUnit] = useState("kg");
  const [expiryDate, setExpiryDate] = useState("2026-05-01");
  const [supplierName, setSupplierName] = useState("新鮮食材供應商");

  const [rawContent, setRawContent] = useState("測試打印內容\\n第二行");
  const [filename, setFilename] = useState("");

  const parseItems = () => {
    try { return JSON.parse(itemsJson); } catch { return []; }
  };

  const renderTicketMockup = () => {
    const t = selectedTicketType;
    const items = parseItems();
    
    return (
      <div 
        className="thermal-paper font-mono text-xs leading-tight" 
        style={{ width: t?.paper_width === "80mm" ? "300px" : t?.paper_width === "50mm" ? "180px" : "220px" }}
      >
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
          {t?.show_dine_type && <div className="text-lg font-bold">{t.name}</div>}
          {t?.show_order_no && <div className="text-sm">ORDER: {orderNo}</div>}
          {t?.show_table_no && <div className="text-xs">桌號: A01</div>}
          {t?.show_dine_type && <div className="text-xs bg-black text-white inline-block px-2 py-0.5 mt-1 rounded">{dineType}</div>}
        </div>
        
        <div className="space-y-1">
          {items.map((item: any[], idx: number) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="flex-1">
                {t?.show_item_qty && <span className="font-bold">{item[1]}x </span>}
                {t?.show_item_name && item[0]}
                {t?.show_item_spec && item[2] && <span className="text-orange-600 text-xs"> ({item[2]})</span>}
              </span>
              {t?.show_item_price && <span className="text-right">¥{((item[1] || 1) * 38).toFixed(0)}</span>}
            </div>
          ))}
        </div>
        
        {ticketNote && t?.show_item_note && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-orange-600 text-xs">
            備註: {ticketNote}
          </div>
        )}
        
        {t?.show_total_amount && (
          <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-right font-bold">
            合計: ¥{items.reduce((sum: number, item: any[]) => sum + ((item[1] || 1) * 38), 0).toFixed(0)}
          </div>
        )}
        
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center text-xs text-gray-500">
          <div>{new Date().toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderLabelMockup = () => {
    const t = selectedTicketType;
    return (
      <div className="thermal-paper font-mono text-xs leading-tight" style={{ width: "180px" }}>
        <div className="text-center border-b-2 border-gray-800 pb-2 mb-2">
          <div className="text-lg font-bold">{materialName}</div>
        </div>
        <div className="space-y-2">
          {t?.show_lot_no && <div className="flex justify-between"><span className="text-gray-600">批次:</span><span className="font-bold">{lotNo}</span></div>}
          {t?.show_qty_info && (
            <div className="flex justify-between text-lg">
              <span className="font-bold">{quantity}</span><span className="font-bold">{unit}</span>
            </div>
          )}
          {t?.show_expiry_date && expiryDate && <div className="flex justify-between"><span className="text-gray-600">效期:</span><span className="text-red-600 font-bold">{expiryDate}</span></div>}
          {t?.show_supplier && supplierName && <div className="text-xs text-gray-600 mt-1 pt-1 border-t border-dashed">{supplierName}</div>}
        </div>
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center"><div className="text-xs text-gray-400">▮▮▮▮▮▮▮▮▮▮</div></div>
      </div>
    );
  };

  const renderRawMockup = () => {
    const lines = rawContent.split("\\n").map(l => l.trim()).filter(Boolean);
    return (
      <div className="thermal-paper font-mono text-xs leading-normal whitespace-pre-wrap" style={{ width: "260px" }}>
        {lines.map((line, idx) => <div key={idx}>{line}</div>)}
      </div>
    );
  };

  const renderMockup = () => {
    if (!selectedTicketType) return null;
    const code = selectedTicketType.code;
    if (code === "label") return renderLabelMockup();
    if (code === "raw") return renderRawMockup();
    return renderTicketMockup();
  };

  async function handlePrint() {
    setLoading(true);
    try {
      let res: DebugPrintResult;
      const code = selectedTicketType?.code || "kitchen";
      
      if (code === "label") {
        res = await invoke<DebugPrintResult>("debug_print_batch_label", {
          req: { lot_no: lotNo, material_name: materialName, quantity: parseFloat(quantity), unit, expiry_date: expiryDate || null, supplier_name: supplierName || null, filename: filename || null },
        });
      } else if (code === "raw") {
        res = await invoke<DebugPrintResult>("debug_print_escpos", {
          content: rawContent.replace(/\\n/g, "\n"),
          filename: filename || null,
        });
      } else {
        const items = JSON.parse(itemsJson);
        res = await invoke<DebugPrintResult>("debug_print_kitchen_ticket", {
          req: { order_no: orderNo, dine_type: dineType, items, note: ticketNote || null, filename: filename || null },
        });
      }
      
      setResult(res);
      toast.success(`已生成 (${res.byte_count} 字節)`);
    } catch (e: any) {
      toast.error(`打印失敗: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  const copyHtml = () => {
    if (result?.html_preview) {
      navigator.clipboard.writeText(result.html_preview);
      toast.success("HTML 已複製");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">打印中心</h1>
          <p className="text-muted-foreground mt-1">模板、票據類型、打印預覽一体化管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab("templates")}>
            <FileText className="h-4 w-4 mr-2" /> 模板
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("ticket-types")}>
            <Tag className="h-4 w-4 mr-2" /> 票據類型
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">預覽與打印</TabsTrigger>
          <TabsTrigger value="templates">模板管理</TabsTrigger>
          <TabsTrigger value="ticket-types">票據類型</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>參數輸入</CardTitle>
                <CardDescription>選擇票據類型並輸入打印參數</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={String(selectedTicketTypeId)} onValueChange={(v) => setSelectedTicketTypeId(Number(v))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="選擇票據類型" /></SelectTrigger>
                    <SelectContent>
                      {ticketTypes.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name} {t.is_default && "(默認)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}><Settings className="h-4 w-4" /></Button>
                </div>

                {selectedTicketType?.code === "label" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>批次號</Label><Input value={lotNo} onChange={e => setLotNo(e.target.value)} /></div>
                      <div className="space-y-2"><Label>材料名稱</Label><Input value={materialName} onChange={e => setMaterialName(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>數量</Label><Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
                      <div className="space-y-2"><Label>單位</Label><Input value={unit} onChange={e => setUnit(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>到期日期</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
                      <div className="space-y-2"><Label>供應商</Label><Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="可選" /></div>
                    </div>
                  </>
                ) : selectedTicketType?.code === "raw" ? (
                  <div className="space-y-2">
                    <Label>打印內容</Label>
                    <Textarea value={rawContent} onChange={e => setRawContent(e.target.value)} rows={6} className="font-mono text-sm" />
                    <p className="text-xs text-muted-foreground">使用 \n 表示換行</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>訂單號</Label><Input value={orderNo} onChange={e => setOrderNo(e.target.value)} /></div>
                      <div className="space-y-2">
                        <Label>用餐類型</Label>
                        <Select value={dineType} onValueChange={setDineType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="堂食">堂食</SelectItem>
                            <SelectItem value="外賣">外賣</SelectItem>
                            <SelectItem value="自取">自取</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>菜品列表 (JSON)</Label>
                      <Textarea value={itemsJson} onChange={e => setItemsJson(e.target.value)} rows={5} className="font-mono text-sm" />
                      <p className="text-xs text-muted-foreground">格式: [["菜名", 數量, "備註"], ...]</p>
                    </div>
                    <div className="space-y-2"><Label>訂單備註</Label><Input value={ticketNote} onChange={e => setTicketNote(e.target.value)} placeholder="可選" /></div>
                  </>
                )}
                
                <div className="space-y-2"><Label>文件名 (可選)</Label><Input value={filename} onChange={e => setFilename(e.target.value)} placeholder="debug" /></div>
                
                <Button onClick={handlePrint} disabled={loading || !selectedTicketType} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />{loading ? "生成中..." : "生成打印"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>即時預覽</CardTitle>
                <CardDescription>熱敏紙效果</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center bg-gray-100 p-4 rounded-lg min-h-[300px]">
                {selectedTicketType ? renderMockup() : <div className="text-muted-foreground">請選擇票據類型</div>}
              </CardContent>
            </Card>
          </div>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>打印結果 ({result.byte_count} 字節)</span>
                  <Button variant="outline" size="sm" onClick={copyHtml}><Copy className="h-4 w-4 mr-2" />複製</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: result.html_preview }} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>打印模板</CardTitle>
                <CardDescription>管理打印模板配置</CardDescription>
              </div>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />���建模板</Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">模板管理功能 - 跳轉至 print-templates-page</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket-types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>票據類型</CardTitle>
                <CardDescription>管理票據類型配置</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingTicketType(null); setEditDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />新建類型
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ticketTypes.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{t.name} {t.is_default && <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">(默認)</span>}</div>
                      <div className="text-sm text-muted-foreground">{t.paper_width} | {t.code}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setEditingTicketType(t); setEditDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTicketType ? "編輯票據類型" : "新建票據類型"}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={() => setEditDialogOpen(false)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}