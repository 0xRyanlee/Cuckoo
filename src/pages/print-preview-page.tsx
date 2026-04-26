import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { Printer, FileText, Tag, Copy } from "lucide-react";
import { toast } from "sonner";

interface DebugPrintResult {
  file_path: string;
  html_preview: string;
  byte_count: number;
}

export function PrintPreviewPage() {
  const [activeTab, setActiveTab] = useState<"kitchen" | "label" | "raw">("kitchen");
  const [result, setResult] = useState<DebugPrintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMockOnly, setShowMockOnly] = useState(false);

  // Kitchen ticket form
  const [orderNo, setOrderNo] = useState("ORD20260424001");
  const [dineType, setDineType] = useState("堂食");
  const [ticketNote, setTicketNote] = useState("");
  const [itemsJson, setItemsJson] = useState(`[
  ["宮保雞丁", 2, "少辣"],
  ["麻婆豆腐", 1, null],
  ["酸菜魚", 1, "加辣"]
]`);

  // Label form
  const [lotNo, setLotNo] = useState("LOT20260424001");
  const [materialName, setMaterialName] = useState("雞胸肉");
  const [quantity, setQuantity] = useState("10.5");
  const [unit, setUnit] = useState("kg");
  const [expiryDate, setExpiryDate] = useState("2026-05-01");
  const [supplierName, setSupplierName] = useState("新鮮食材供應商");

  // Raw ESC/POS
  const [rawContent, setRawContent] = useState("測試打印內容\\n第二行");
  const [filename, setFilename] = useState("");

  // Parse items for mockup
  const parseItems = () => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  // Mockup render helpers
  const renderKitchenMockup = () => {
    const items = parseItems();
    return (
      <div className="thermal-paper font-mono text-xs leading-tight">
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
          <div className="text-lg font-bold">廚房單</div>
          <div className="text-sm">ORDER: {orderNo}</div>
          <div className="text-xs bg-black text-white inline-block px-2 py-0.5 mt-1 rounded">
            {dineType}
          </div>
        </div>
        <div className="space-y-1">
          {items.map((item: any[], idx: number) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="flex-1">
                {item[1]}x {item[0]}
                {item[2] && <span className="text-orange-600 text-xs"> ({item[2]})</span>}
              </span>
            </div>
          ))}
        </div>
        {ticketNote && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-orange-600 text-xs">
            備註: {ticketNote}
          </div>
        )}
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center text-xs text-gray-500">
          <div>{new Date().toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderLabelMockup = () => {
    return (
      <div className="thermal-paper font-mono text-xs leading-tight">
        <div className="text-center border-b-2 border-gray-800 pb-2 mb-2">
          <div className="text-lg font-bold">{materialName}</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">批次:</span>
            <span className="font-bold">{lotNo}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-bold">{quantity}</span>
            <span className="font-bold">{unit}</span>
          </div>
          {expiryDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">效期:</span>
              <span className="text-red-600 font-bold">{expiryDate}</span>
            </div>
          )}
          {supplierName && (
            <div className="text-xs text-gray-600 mt-1 pt-1 border-t border-dashed">
              {supplierName}
            </div>
          )}
        </div>
        <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center">
          <div className="text-xs text-gray-400">▮▮▮▮▮▮▮▮▮▮▮▮▮</div>
        </div>
      </div>
    );
  };

  const renderRawMockup = () => {
    const lines = rawContent.split("\\n").map(l => l.trim()).filter(Boolean);
    return (
      <div className="thermal-paper font-mono text-xs leading-normal whitespace-pre-wrap">
        {lines.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    );
  };

  async function handlePrintKitchen() {
    setLoading(true);
    try {
      const items = JSON.parse(itemsJson);
      const res = await invoke<DebugPrintResult>("debug_print_kitchen_ticket", {
        req: {
          order_no: orderNo,
          dine_type: dineType,
          items,
          note: ticketNote || null,
          filename: filename || null,
        },
      });
      setResult(res);
      toast.success(`廚房單已保存 (${res.byte_count} 字節)`);
    } catch (e: any) {
      toast.error(`打印失敗: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrintLabel() {
    setLoading(true);
    try {
      const res = await invoke<DebugPrintResult>("debug_print_batch_label", {
        req: {
          lot_no: lotNo,
          material_name: materialName,
          quantity: parseFloat(quantity),
          unit,
          expiry_date: expiryDate || null,
          supplier_name: supplierName || null,
          filename: filename || null,
        },
      });
      setResult(res);
      toast.success(`標籤已保存 (${res.byte_count} 字節)`);
    } catch (e: any) {
      toast.error(`打印失敗: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrintRaw() {
    setLoading(true);
    try {
      const res = await invoke<DebugPrintResult>("debug_print_escpos", {
        content: rawContent.replace(/\\n/g, "\n"),
        filename: filename || null,
      });
      setResult(res);
      toast.success(`ESC/POS 已保存 (${res.byte_count} 字節)`);
    } catch (e: any) {
      toast.error(`打印失敗: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  function copyHtml() {
    if (result?.html_preview) {
      navigator.clipboard.writeText(result.html_preview);
      toast.success("HTML 已複製到剪貼板");
    }
  }

  function openHtmlPreview() {
    if (result?.html_preview) {
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>打印預覽</title>
          <style>
            body { background: #0f0f23; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          ${result.html_preview}
        </body>
        </html>
      `], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">打印預覽 & 調試</h1>
          <p className="text-muted-foreground mt-1">無需實體打印機，預覽打印效果並保存 ESC/POS 指令</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={activeTab === "kitchen" ? "default" : "outline"} onClick={() => setActiveTab("kitchen")} className="gap-2">
          <FileText className="h-4 w-4" /> 廚房單
        </Button>
        <Button variant={activeTab === "label" ? "default" : "outline"} onClick={() => setActiveTab("label")} className="gap-2">
          <Tag className="h-4 w-4" /> 批次標籤
        </Button>
        <Button variant={activeTab === "raw" ? "default" : "outline"} onClick={() => setActiveTab("raw")} className="gap-2">
          <Printer className="h-4 w-4" /> 原始 ESC/POS
        </Button>
      </div>

      {/* Kitchen Ticket Form */}
      {activeTab === "kitchen" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>廚房單參數</CardTitle>
              <CardDescription>設置訂單信息以生成廚房單預覽</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>訂單號</Label>
                  <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                </div>
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
                <Textarea value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} rows={5} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">格式: [["菜名", 數量, "備註"], ...]</p>
              </div>
              <div className="space-y-2">
                <Label>訂單備註</Label>
                <Input value={ticketNote} onChange={(e) => setTicketNote(e.target.value)} placeholder="可選" />
              </div>
              <div className="space-y-2">
                <Label>文件名 (可選)</Label>
                <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="debug_kitchen" />
              </div>
              <Button onClick={handlePrintKitchen} disabled={loading} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                {loading ? "生成中..." : "生成廚房單預覽"}
              </Button>
            </CardContent>
          </Card>

          {/* Real-time Mockup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>即時預覽</span>
                <Button variant="outline" size="sm" onClick={() => setShowMockOnly(!showMockOnly)}>
                  {showMockOnly ? "僅預覽" : "顯示實際"}
                </Button>
              </CardTitle>
              <CardDescription>實時模擬熱敏紙打印效果</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
              <div className="bg-white p-3 rounded-sm shadow-lg" style={{ width: "280px", minHeight: "200px" }}>
                {renderKitchenMockup()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

{/* Batch Label Form */}
      {activeTab === "label" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>批次標籤參數</CardTitle>
              <CardDescription>設置材料信息以生成批次標籤預覽</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>批次號</Label>
                  <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>材料名稱</Label>
                  <Input value={materialName} onChange={(e) => setMaterialName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>數量</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>單位</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>到期日期</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>供應商</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="可選" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>文件名 (可選)</Label>
                <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="debug_label" />
              </div>
              <Button onClick={handlePrintLabel} disabled={loading} className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                {loading ? "生成中..." : "生成標籤預覽"}
              </Button>
            </CardContent>
          </Card>

          {/* Real-time Mockup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>即時預覽</span>
                <Button variant="outline" size="sm" onClick={() => setShowMockOnly(!showMockOnly)}>
                  {showMockOnly ? "僅預覽" : "顯示實際"}
                </Button>
              </CardTitle>
              <CardDescription>實時模擬熱敏紙打印效果</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
              <div className="bg-white p-3 rounded-sm shadow-lg" style={{ width: "200px", minHeight: "150px" }}>
                {renderLabelMockup()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Raw ESC/POS Form */}
      {activeTab === "raw" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>原始 ESC/POS 指令</CardTitle>
              <CardDescription>輸入自定義文本內容生成 ESC/POS 指令</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>打印內容</Label>
                <Textarea value={rawContent} onChange={(e) => setRawContent(e.target.value)} rows={6} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">使用 \n 表示換行</p>
              </div>
              <div className="space-y-2">
                <Label>文件名 (可選)</Label>
                <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="debug_raw" />
              </div>
              <Button onClick={handlePrintRaw} disabled={loading} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                {loading ? "生成中..." : "生成 ESC/POS 指令"}
              </Button>
            </CardContent>
          </Card>

          {/* Real-time Mockup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>即時預覽</span>
                <Button variant="outline" size="sm" onClick={() => setShowMockOnly(!showMockOnly)}>
                  {showMockOnly ? "僅預覽" : "顯示實際"}
                </Button>
              </CardTitle>
              <CardDescription>實時模擬熱敏紙打印效果</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
              <div className="bg-white p-3 rounded-sm shadow-lg" style={{ width: "280px", minHeight: "150px" }}>
                {renderRawMockup()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Raw ESC/POS Form */}
      {activeTab === "raw" && (
        <Card>
          <CardHeader>
            <CardTitle>原始 ESC/POS 指令</CardTitle>
            <CardDescription>輸入自定義文本內容生成 ESC/POS 指令</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>打印內容</Label>
              <Textarea value={rawContent} onChange={(e) => setRawContent(e.target.value)} rows={6} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">使用 \\n 表示換行</p>
            </div>
            <div className="space-y-2">
              <Label>文件名 (可選)</Label>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="debug_raw" />
            </div>
            <Button onClick={handlePrintRaw} disabled={loading} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              {loading ? "生成中..." : "生成 ESC/POS 指令"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>打印結果</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyHtml} className="gap-1">
                  <Copy className="h-3 w-3" /> 複製 HTML
                </Button>
                <Button variant="outline" size="sm" onClick={openHtmlPreview} className="gap-1">
                  <Printer className="h-3 w-3" /> 預覽
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              文件: {result.file_path} | 大小: {result.byte_count} 字節
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div dangerouslySetInnerHTML={{ __html: result.html_preview }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
