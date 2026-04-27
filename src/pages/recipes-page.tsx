import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Plus, ChefHat, Trash2, Pencil, Save, X, ChevronRight, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { parseSafeFloat } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";

interface Recipe {
  id: number;
  code: string;
  name: string;
  recipe_type: string;
  output_qty: number;
}

interface RecipeItem {
  id: number;
  recipe_id: number;
  item_type: string;
  ref_id: number;
  qty: number;
  unit_id: number;
  wastage_rate: number;
  note: string | null;
  sort_no: number;
}

interface RecipeWithItems {
  recipe: Recipe;
  items: RecipeItem[];
}

interface RecipeCostItem { material_name: string; qty: number; unit: string; cost_per_unit: number; wastage_rate: number; line_cost: number; }
interface RecipeCostResult {
  recipe_id: number;
  recipe_name: string;
  total_cost: number;
  cost_per_unit: number;
  output_qty: number;
  items: RecipeCostItem[];
}

interface Material {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  base_unit_id: number;
  tags: { id: number; code: string; name: string; color?: string }[];
  category?: { id: number; code: string; name: string };
  base_unit?: { id: number; code: string; name: string };
}

interface Unit {
  id: number;
  code: string;
  name: string;
}

interface RecipesPageProps {
  recipes: Recipe[];
  selectedRecipe: RecipeWithItems | null;
  recipeCost: RecipeCostResult | null;
  materials: Material[];
  units: Unit[];
  onCreateRecipe: (data: { code: string; name: string }) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: number) => void;
  onUpdateRecipe: (id: number, name: string, output_qty: number) => void;
  onAddRecipeItem: (recipe_id: number, item_type: string, ref_id: number, qty: number, unit_id: number, wastage_rate: number) => void;
  onDeleteRecipeItem: (item_id: number, recipe_id: number) => void;
  onUpdateRecipeItem: (item_id: number, recipe_id: number, qty: number, wastage_rate: number) => void;
  onRecalculateCost: (recipe_id: number) => void;
  searchQuery?: string;
}

export function RecipesPage({
  recipes,
  selectedRecipe,
  recipeCost,
  materials,
  units,
  onCreateRecipe,
  onViewRecipe,
  onDeleteRecipe,
  onUpdateRecipe,
  onAddRecipeItem,
  onDeleteRecipeItem,
  onUpdateRecipeItem,
  onRecalculateCost,
  searchQuery,
}: RecipesPageProps) {
  const filteredRecipes = recipes.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
  });
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeCode, setNewRecipeCode] = useState("");

  const [editRecipeId, setEditRecipeId] = useState<number | null>(null);
  const [editRecipeName, setEditRecipeName] = useState("");
  const [editRecipeOutputQty, setEditRecipeOutputQty] = useState("");

  const [deleteItemConfirm, setDeleteItemConfirm] = useState<number | null>(null);
  const [deleteRecipeConfirm, setDeleteRecipeConfirm] = useState<number | null>(null);

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set<number>());
  const [subRecipes, setSubRecipes] = useState<Record<number, RecipeItem[]>>({});

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemQty, setEditingItemQty] = useState("");
  const [editingItemWastage, setEditingItemWastage] = useState("");

  const [quickAddRecipeId, setQuickAddRecipeId] = useState<number | null>(null);
  const [quickAddMaterial, setQuickAddMaterial] = useState("");
  const [quickAddQty, setQuickAddQty] = useState("");
  const [quickAddUnit, setQuickAddUnit] = useState("");
  const [quickAddWastage, setQuickAddWastage] = useState("0");

  async function toggleExpand(refId: number) {
    if (expandedItems.has(refId)) {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        next.delete(refId);
        return next;
      });
    } else {
      if (!subRecipes[refId]) {
        try {
          const data = await invoke<RecipeWithItems>("get_recipe_with_items", { id: refId });
          setSubRecipes((prev) => ({ ...prev, [refId]: data.items }));
        } catch (e) {
          toast.error("加载子配方明细失败");
          return;
        }
      }
      setExpandedItems((prev) => {
        const next = new Set(prev);
        next.add(refId);
        return next;
      });
    }
  }

  function startEditItem(item: RecipeItem) {
    setEditingItemId(item.id);
    setEditingItemQty(item.qty.toString());
    setEditingItemWastage((item.wastage_rate * 100).toString());
  }

  async function saveEditItem() {
    if (!editingItemId || !selectedRecipe) return;
    const qty = parseSafeFloat(editingItemQty);
    const wastage = parseSafeFloat(editingItemWastage);
    if (qty === null || qty <= 0) {
      toast.error("数量必须大于 0");
      return;
    }
    if (wastage !== null && wastage < 0) {
      toast.error("损耗率不能为负数");
      return;
    }

    const currentItem = selectedRecipe.items.find(i => i.id === editingItemId);
    if (currentItem?.item_type === "sub_recipe") {
      try {
        const count = await invoke<number>("get_recipe_usage_count", { recipeId: currentItem.ref_id });
        if (count > 0) {
          if (!confirm(`此半成品被 ${count} 個其他配方引用，修改其用量或損耗將影響所有相關成本，確定修改嗎？`)) {
            return;
          }
        }
      } catch (e) {
        console.error("檢查依賴失敗", e);
      }
    }

    onUpdateRecipeItem(editingItemId, selectedRecipe.recipe.id, qty, wastage ?? 0);
    setEditingItemId(null);
    onRecalculateCost(selectedRecipe.recipe.id);
  }

  function openQuickAdd(recipeId: number) {
    setQuickAddRecipeId(recipeId);
    setQuickAddMaterial("");
    setQuickAddQty("");
    setQuickAddUnit("");
    setQuickAddWastage("0");
  }

  function saveQuickAdd() {
    if (!quickAddRecipeId || !quickAddMaterial || !quickAddQty || !quickAddUnit) {
      toast.error("请填写必填字段");
      return;
    }
    const qty = parseSafeFloat(quickAddQty);
    const wastage = parseSafeFloat(quickAddWastage);
    if (qty === null || qty <= 0) {
      toast.error("数量必须大于 0");
      return;
    }
    const isMaterial = quickAddMaterial.startsWith("m_");
    const refId = parseInt(quickAddMaterial.substring(2));
    onAddRecipeItem(
      quickAddRecipeId,
      isMaterial ? "material" : "sub_recipe",
      refId,
      qty,
      parseInt(quickAddUnit),
      wastage ?? 0,
    );
    setQuickAddRecipeId(null);
  }

  function openEditRecipe(recipe: Recipe) {
    setEditRecipeId(recipe.id);
    setEditRecipeName(recipe.name);
    setEditRecipeOutputQty(recipe.output_qty.toString());
  }

  async function saveEditRecipe() {
    if (!editRecipeId) return;
    
    try {
      const count = await invoke<number>("get_recipe_usage_count", { recipeId: editRecipeId });
      if (count > 0) {
        if (!confirm(`此配方作為半成品被 ${count} 個其他配方引用，修改名稱或產出量將直接影響它們的成本核算，確定執行嗎？`)) {
          return;
        }
      }
    } catch (e) {
      console.error("檢查依賴失敗", e);
    }

    onUpdateRecipe(editRecipeId, editRecipeName, parseFloat(editRecipeOutputQty) || 1);
    setEditRecipeId(null);
  }

  function getRefName(itemType: string, refId: number): string {
    if (itemType === "sub_recipe") {
      return recipes.find((r) => r.id === refId)?.name || `配方 #${refId}`;
    }
    return materials.find((m) => m.id === refId)?.name || `材料 #${refId}`;
  }


  function getUnitName(unitId: number): string {
    return units.find((u) => u.id === unitId)?.name || `單位 #${unitId}`;
  }

  function renderSubItems(subRecipeId: number, depth: number = 1): React.ReactNode {
    if (depth > 5) return <div className="text-destructive text-xs py-1">超过最大展开深度，存在循环依赖风险</div>;
    const items = subRecipes[subRecipeId];
    if (!items) return <div className="text-muted-foreground text-xs py-1 px-4">加载中...</div>;
    if (items.length === 0) return <div className="text-muted-foreground text-xs py-1 px-4">空配方</div>;
    
    return (
      <div className="space-y-1">
        {items.map(item => {
          const hasSub = item.item_type === "sub_recipe";
          const isExpanded = expandedItems.has(item.ref_id);
          return (
            <div key={item.id} className="flex flex-col border-b last:border-0 border-muted/30 py-1">
              <div className="flex items-center text-sm">
                <div className="flex-1 flex items-center gap-1">
                  {hasSub ? (
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 mr-1" onClick={() => toggleExpand(item.ref_id)}>
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                  ) : <span className="w-5 inline-block" />}
                  {hasSub && <Badge variant="outline" className="mr-1 text-[10px] px-1 py-0 h-4">半成品</Badge>}
                  {getRefName(item.item_type, item.ref_id)}
                </div>
                <div className="w-24 text-right text-muted-foreground mr-[5.5rem]">{item.qty} {getUnitName(item.unit_id)}</div>
                <div className="w-24 text-right text-muted-foreground mr-[7.5rem]">{item.wastage_rate}%</div>
              </div>
              {hasSub && isExpanded && (
                <div className="pl-6 mt-1 border-l-2 border-muted/50 ml-2">
                  {renderSubItems(item.ref_id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">配方管理</h2>
          <p className="text-sm text-muted-foreground">管理配方、配方明细和成本计算</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              配方列表
            </CardTitle>
            <CardDescription>共 {filteredRecipes.length} 个配方{filteredRecipes.length !== recipes.length ? `（筛选自 ${recipes.length} 个）` : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecipes.length === 0 ? (
              <EmptyState icon={ChefHat} title="暂无配方" description="添加配方开始管理成本" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="text-right">产出量</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="font-medium">
                        {editRecipeId === r.id ? (
                          <div className="flex gap-2">
                            <Input value={editRecipeName} onChange={(e) => setEditRecipeName(e.target.value)} className="h-8" />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEditRecipe}><Save className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditRecipeId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : r.name}
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.recipe_type}</Badge></TableCell>
                      <TableCell className="text-right">{r.output_qty}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onViewRecipe(r)}>查看</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRecipe(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteRecipeConfirm(r.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <CardTitle>新增配方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-code">配方代码</Label>
              <Input id="recipe-code" value={newRecipeCode} onChange={(e) => setNewRecipeCode(e.target.value)} placeholder="如: RCP001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-name">配方名称</Label>
              <Input id="recipe-name" value={newRecipeName} onChange={(e) => setNewRecipeName(e.target.value)} placeholder="输入配方名称..." />
            </div>
            <Button className="w-full" onClick={() => { onCreateRecipe({ code: newRecipeCode, name: newRecipeName }); setNewRecipeCode(""); setNewRecipeName(""); }}>
              <Plus className="mr-2 h-4 w-4" />新增
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedRecipe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>配方详情: {selectedRecipe.recipe.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onRecalculateCost(selectedRecipe.recipe.id)}>重新计算成本</Button>
              </div>
            </CardTitle>
            <CardDescription>代码: {selectedRecipe.recipe.code} | 类型: {selectedRecipe.recipe.recipe_type} | 产出: {selectedRecipe.recipe.output_qty}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-3">配方明细 ({selectedRecipe.items.length} 项)
                  <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={() => openQuickAdd(selectedRecipe.recipe.id)}>
                    <Plus className="h-3 w-3 mr-1" />快捷添加
                  </Button>
                </h3>
                {selectedRecipe.items.length === 0 ? (
                  <EmptyState icon={ChefHat} title="暂无明细" description="点击添加材料开始" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>原料 / 半成品</TableHead>
                        <TableHead className="text-right w-32">用量</TableHead>
                        <TableHead className="text-right w-24">损耗率</TableHead>
                        <TableHead className="text-right w-20">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecipe.items.map((item) => {
                        const hasSubItems = item.item_type === "sub_recipe";
                        const isExpanded = expandedItems.has(item.ref_id);
                        return (
                          <Fragment key={item.id}>
                            <TableRow>
                              <TableCell className="p-2">
                                {hasSubItems && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(item.ref_id)}>
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.item_type === "sub_recipe" && <Badge variant="outline" className="mr-1 text-xs">半成品</Badge>}
                                {getRefName(item.item_type, item.ref_id)}
                              </TableCell>
                              {editingItemId === item.id ? (
                                <>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Input className="h-7 w-20 text-right" type="number" value={editingItemQty} onChange={(e) => setEditingItemQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEditItem()} />
                                      <span className="text-xs text-muted-foreground">{getUnitName(item.unit_id)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Input className="h-7 w-16 text-right" type="number" value={editingItemWastage} onChange={(e) => setEditingItemWastage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEditItem()} />
                                      <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEditItem}><Save className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItemId(null)}><X className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="text-right cursor-pointer hover:bg-muted" onClick={() => startEditItem(item)}>
                                    {item.qty} {getUnitName(item.unit_id)}
                                  </TableCell>
                                  <TableCell className="text-right cursor-pointer hover:bg-muted" onClick={() => startEditItem(item)}>
                                    {(item.wastage_rate * 100).toFixed(1)}%
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItemConfirm(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                            {hasSubItems && isExpanded && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="p-0 pl-10 border-l-[3px] border-l-primary/30">
                                  <div className="py-2 pr-4 bg-muted/10">
                                    {renderSubItems(item.ref_id)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {quickAddRecipeId === selectedRecipe.recipe.id && (
                  <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-muted/30">
                    <Select value={quickAddMaterial} onValueChange={setQuickAddMaterial}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="选择材料 / 半成品" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>原材料</SelectLabel>
                          {materials.map((m) => <SelectItem key={`m_${m.id}`} value={`m_${m.id}`}>{m.name}</SelectItem>)}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>半成品(子配方)</SelectLabel>
                          {recipes.filter((r) => r.id !== quickAddRecipeId).map((r) => <SelectItem key={`r_${r.id}`} value={`r_${r.id}`}>{r.name}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input className="w-24" type="number" placeholder="用量" value={quickAddQty} onChange={(e) => setQuickAddQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveQuickAdd()} />
                    <Select value={quickAddUnit} onValueChange={setQuickAddUnit}>
                      <SelectTrigger className="w-24"><SelectValue placeholder="单位" /></SelectTrigger>
                      <SelectContent>
                        {units.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="w-16" type="number" placeholder="0" value={quickAddWastage} onChange={(e) => setQuickAddWastage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveQuickAdd()} />
                    <span className="text-xs text-muted-foreground">%</span>
                    <Button size="sm" onClick={saveQuickAdd} disabled={!quickAddMaterial || !quickAddQty || !quickAddUnit}><Save className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setQuickAddRecipeId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              {recipeCost && (
                <div>
                  <h3 className="font-medium mb-3">成本计算</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <span className="text-sm text-muted-foreground">总成本</span>
                      <span className="text-lg font-semibold">¥{recipeCost.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <span className="text-sm text-muted-foreground">单位成本</span>
                      <span className="text-lg font-semibold">¥{recipeCost.cost_per_unit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <span className="text-sm text-muted-foreground">产出量</span>
                      <span className="text-lg font-semibold">{recipeCost.output_qty}</span>
                    </div>
                    <Separator />
                    {recipeCost.items && recipeCost.items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">成本明细</h4>
                        <div className="space-y-2">
                          {recipeCost.items.map((ci, i) => {
                            const pct = recipeCost.total_cost > 0 ? (ci.line_cost / recipeCost.total_cost) * 100 : 0;
                            const barColor = pct > 50 ? "bg-red-500" : pct > 20 ? "bg-amber-500" : "bg-green-500";
                            return (
                              <div key={i}>
                                <div className="flex items-center justify-between text-sm py-1">
                                  <span className="text-muted-foreground flex-1 truncate">{ci.material_name}</span>
                                  <span className="font-mono ml-2">¥{ci.line_cost.toFixed(2)} ({pct.toFixed(1)}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}



      <Dialog open={!!deleteItemConfirm} onOpenChange={() => setDeleteItemConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">确定要删除此配方材料项吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleteItemConfirm && selectedRecipe) { onDeleteRecipeItem(deleteItemConfirm, selectedRecipe.recipe.id); } setDeleteItemConfirm(null); }}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRecipeConfirm} onOpenChange={() => setDeleteRecipeConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除配方</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">确定要删除此配方吗？此操作不可撤销，将同时删除所有关联的配方明细。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRecipeConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleteRecipeConfirm) { onDeleteRecipe(deleteRecipeConfirm); } setDeleteRecipeConfirm(null); }}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
