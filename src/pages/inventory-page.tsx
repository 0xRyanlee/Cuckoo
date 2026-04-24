import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Package, ArrowUpDown, Trash2, ArrowRightLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Material {
  id: number;
  name: string;
  code: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface InventorySummary {
  material_id: number;
  material_name: string;
  total_qty: number;
  reserved_qty: number;
  available_qty: number;
}

interface InventoryBatch {
  id: number;
  material_id: number;
  material_name?: string;
  lot_no: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date: string | null;
  supplier_id: number | null;
}

interface InventoryTxn {
  id: number;
  txn_no: string;
  txn_type: string;
  ref_type: string | null;
  ref_id: number | null;
  lot_id: number | null;
  material_id: number;
  qty_delta: number;
  created_at: string;
}

interface InventoryPageProps {
  inventorySummary: InventorySummary[];
  inventoryBatches: InventoryBatch[];
  inventoryTxns: InventoryTxn[];
  materials: Material[];
  suppliers: Supplier[];
  onCreateBatch: (data: {
    material_id: number; lot_no: string; quantity: number; cost_per_unit: number;
    supplier_id: number | null; expiry_date: string | null; production_date: string | null;
  }) => void;
  onAdjustInventory: (lot_id: number, qty_delta: number, reason: string) => void;
  onRecordWastage: (lot_id: number, qty: number, wastage_type: string) => void;
  onDeleteBatch: (batch_id: number) => void;
  searchQuery?: string;
}

export function InventoryPage({
  inventorySummary, inventoryBatches, inventoryTxns,
  materials, suppliers, onCreateBatch, onAdjustInventory, onRecordWastage,
  searchQuery,
}: InventoryPageProps) {
  const filteredSummary = inventorySummary.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.material_name.toLowerCase().includes(q);
  });
  const filteredBatches = inventoryBatches.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.lot_no.toLowerCase().includes(q) || (b.material_name || "").toLowerCase().includes(q);
  });
  const filteredTxns = inventoryTxns.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.txn_no.toLowerCase().includes(q) || t.txn_type.toLowerCase().includes(q);
  });
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [wastageDialogOpen, setWastageDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ material_id: "", lot_no: "", quantity: "", cost_per_unit: "", supplier_id: "", expiry_date: "", production_date: "" });
  const [adjustForm, setAdjustForm] = useState({ lot_id: 0, qty_delta: "", reason: "" });
  const [wastageForm, setWastageForm] = useState({ lot_id: 0, qty: "", wastage_type: "normal" });

  const lowStockItems = filteredSummary.filter((s) => s.available_qty < 10);

  const getTxnTypeBadge = (type: string) => {
    switch (type) {
      case "reserve": return <Badge className="bg-blue-600">预扣</Badge>;
      case "consume": return <Badge className="bg-emerald-600">实扣</Badge>;
      case "release": return <Badge variant="secondary">回补</Badge>;
      case "purchase_in": return <Badge className="bg-purple-600">入库</Badge>;
      case "adjustment": return <Badge className="bg-amber-600">调整</Badge>;
      case "wastage": return <Badge variant="destructive">损耗</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getMaterialName = (id: number) => materials.find((m) => m.id === id)?.name || `材料 #${id}`;

  function handleCreateBatch() {
    if (!batchForm.material_id || !batchForm.lot_no || !batchForm.quantity) return;
    onCreateBatch({
      material_id: parseInt(batchForm.material_id),
      lot_no: batchForm.lot_no,
      quantity: parseFloat(batchForm.quantity),
      cost_per_unit: parseFloat(batchForm.cost_per_unit) || 0,
      supplier_id: batchForm.supplier_id ? parseInt(batchForm.supplier_id) : null,
      expiry_date: batchForm.expiry_date || null,
      production_date: batchForm.production_date || null,
    });
    setBatchForm({ material_id: "", lot_no: "", quantity: "", cost_per_unit: "", supplier_id: "", expiry_date: "", production_date: "" });
    setBatchDialogOpen(false);
  }

  function handleAdjust() {
    if (!adjustForm.lot_id || !adjustForm.qty_delta || !adjustForm.reason) return;
    onAdjustInventory(adjustForm.lot_id, parseFloat(adjustForm.qty_delta), adjustForm.reason);
    setAdjustForm({ lot_id: 0, qty_delta: "", reason: "" });
    setAdjustDialogOpen(false);
  }

  function handleWastage() {
    if (!wastageForm.lot_id || !wastageForm.qty) return;
    onRecordWastage(wastageForm.lot_id, parseFloat(wastageForm.qty), wastageForm.wastage_type);
    setWastageForm({ lot_id: 0, qty: "", wastage_type: "normal" });
    setWastageDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">库存管理</h2>
          <p className="text-sm text-muted-foreground">入库、调整、损耗与库存追踪</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />进货入库
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />库存预警 ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>材料</TableHead>
                  <TableHead className="text-right">总量</TableHead>
                  <TableHead className="text-right">预扣</TableHead>
                  <TableHead className="text-right">可用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((summary) => (
                  <TableRow key={summary.material_id}>
                    <TableCell className="font-medium">{summary.material_name}</TableCell>
                    <TableCell className="text-right">{summary.total_qty.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{summary.reserved_qty.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{summary.available_qty.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />库存汇总</CardTitle>
            <CardDescription>{filteredSummary.length} 种材料</CardDescription>
          </CardHeader>
          <CardContent>
            {inventorySummary.length === 0 ? (
              <EmptyState icon={Package} title="暂无库存数据" description="进货入库后将显示库存" />
            ) : (
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>材料</TableHead>
                      <TableHead className="text-right">总量</TableHead>
                      <TableHead className="text-right">可用</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventorySummary.map((summary) => (
                      <TableRow key={summary.material_id}>
                        <TableCell className="font-medium">{summary.material_name}</TableCell>
                        <TableCell className="text-right">{summary.total_qty.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-medium ${summary.available_qty < 10 ? "text-destructive" : "text-emerald-500"}`}>
                          {summary.available_qty.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>批次库存</CardTitle>
            <CardDescription>{filteredBatches.length} 个批次{filteredBatches.length !== inventoryBatches.length ? `（篩選自 ${inventoryBatches.length} 个）` : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBatches.length === 0 ? (
              <EmptyState icon={Package} title="暂无批次数据" description="入库批次将在此显示" />
            ) : (
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>批次号</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="font-mono text-xs">{batch.lot_no}</div>
                          <div className="text-xs text-muted-foreground">{getMaterialName(batch.material_id)}</div>
                        </TableCell>
                        <TableCell className="text-right">{batch.quantity.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAdjustForm({ lot_id: batch.id, qty_delta: "", reason: "" }); setAdjustDialogOpen(true); }}>
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setWastageForm({ lot_id: batch.id, qty: "", wastage_type: "normal" }); setWastageDialogOpen(true); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>库存交易流水</CardTitle>
          <CardDescription>最近 {filteredTxns.length} 条记录{filteredTxns.length !== inventoryTxns.length ? `（篩選自 ${inventoryTxns.length} 条）` : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTxns.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} title="暂无交易记录" description="库存变动将在此显示" />
          ) : (
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易号</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>材料</TableHead>
                    <TableHead className="text-right">数量变化</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTxns.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.txn_no}</TableCell>
                      <TableCell>{getTxnTypeBadge(txn.txn_type)}</TableCell>
                      <TableCell className="text-xs">{getMaterialName(txn.material_id)}</TableCell>
                      <TableCell className={`text-right font-medium ${txn.qty_delta < 0 ? "text-destructive" : "text-emerald-500"}`}>
                        {txn.qty_delta > 0 ? "+" : ""}{txn.qty_delta.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{txn.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>进货入库</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-material">材料</Label>
              <Select value={batchForm.material_id} onValueChange={(v) => setBatchForm({ ...batchForm, material_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择材料" /></SelectTrigger>
                <SelectContent>
                  {materials.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-lot">批次号</Label>
              <Input id="batch-lot" value={batchForm.lot_no} onChange={(e) => setBatchForm({ ...batchForm, lot_no: e.target.value })} placeholder="如：LOT-20260423-001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-qty">数量</Label>
                <Input id="batch-qty" type="number" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-cost">单位成本</Label>
                <Input id="batch-cost" type="number" value={batchForm.cost_per_unit} onChange={(e) => setBatchForm({ ...batchForm, cost_per_unit: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-supplier">供应商</Label>
              <Select value={batchForm.supplier_id} onValueChange={(v) => setBatchForm({ ...batchForm, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择供应商（可选）" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-production">生产日期</Label>
                <Input id="batch-production" type="date" value={batchForm.production_date} onChange={(e) => setBatchForm({ ...batchForm, production_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-expiry">过期日期</Label>
                <Input id="batch-expiry" type="date" value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateBatch}>确认入库</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>库存调整</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-delta">调整数量（正数增加，负数减少）</Label>
              <Input id="adjust-delta" type="number" value={adjustForm.qty_delta} onChange={(e) => setAdjustForm({ ...adjustForm, qty_delta: e.target.value })} placeholder="如：-2.5 或 5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">调整原因</Label>
              <Input id="adjust-reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="如：盘点差异、报损" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjust}>确认调整</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wastageDialogOpen} onOpenChange={setWastageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>记录损耗</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wastage-qty">损耗数量</Label>
              <Input id="wastage-qty" type="number" value={wastageForm.qty} onChange={(e) => setWastageForm({ ...wastageForm, qty: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wastage-type">损耗类型</Label>
              <Select value={wastageForm.wastage_type} onValueChange={(v) => setWastageForm({ ...wastageForm, wastage_type: v })}>
                <SelectTrigger><SelectValue placeholder="选择损耗类型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常损耗</SelectItem>
                  <SelectItem value="rd">研发损耗</SelectItem>
                  <SelectItem value="fail">失败损耗</SelectItem>
                  <SelectItem value="seasonal">季节性损耗</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWastageDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleWastage}>确认损耗</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
