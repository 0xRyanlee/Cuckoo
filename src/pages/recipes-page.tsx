import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChefHat, Trash2, Pencil, Save, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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

  const [addItemRecipeId, setAddItemRecipeId] = useState<number | null>(null);
  const [addItemType, setAddItemType] = useState<"material" | "sub_recipe">("material");
  const [addItemMaterial, setAddItemMaterial] = useState("");
  const [addItemQty, setAddItemQty] = useState("");
  const [addItemUnit, setAddItemUnit] = useState("");
  const [addItemWastage, setAddItemWastage] = useState("0");

  const [deleteItemConfirm, setDeleteItemConfirm] = useState<number | null>(null);

  function openEditRecipe(recipe: Recipe) {
    setEditRecipeId(recipe.id);
    setEditRecipeName(recipe.name);
    setEditRecipeOutputQty(recipe.output_qty.toString());
  }

  function saveEditRecipe() {
    if (!editRecipeId) return;
    onUpdateRecipe(editRecipeId, editRecipeName, parseFloat(editRecipeOutputQty) || 1);
    setEditRecipeId(null);
  }

  function openAddItem(recipeId: number) {
    setAddItemRecipeId(recipeId);
    setAddItemType("material");
    setAddItemMaterial("");
    setAddItemQty("");
    setAddItemUnit("");
    setAddItemWastage("0");
  }

  function saveAddItem() {
    if (!addItemRecipeId || !addItemMaterial || !addItemQty || !addItemUnit) return;
    const qty = parseFloat(addItemQty);
    if (isNaN(qty) || qty <= 0) return;
    onAddRecipeItem(
      addItemRecipeId,
      addItemType,
      parseInt(addItemMaterial),
      qty,
      parseInt(addItemUnit),
      parseFloat(addItemWastage) || 0,
    );
    setAddItemRecipeId(null);
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAddItem(r.id)}><Plus className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteRecipe(r.id)}><Trash2 className="h-4 w-4" /></Button>
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
                <Button variant="outline" size="sm" onClick={() => openAddItem(selectedRecipe.recipe.id)}><Plus className="mr-1 h-3 w-3" />添加材料</Button>
              </div>
            </CardTitle>
            <CardDescription>代码: {selectedRecipe.recipe.code} | 类型: {selectedRecipe.recipe.recipe_type} | 产出: {selectedRecipe.recipe.output_qty}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-3">配方明细 ({selectedRecipe.items.length} 项)</h3>
                {selectedRecipe.items.length === 0 ? (
                  <EmptyState icon={ChefHat} title="暂无明细" description="点击添加材料开始" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>原料 / 半成品</TableHead>
                        <TableHead className="text-right">用量</TableHead>
                        <TableHead className="text-right">損耗率</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecipe.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.item_type === "sub_recipe" && <Badge variant="outline" className="mr-1 text-xs">半成品</Badge>}
                            {getRefName(item.item_type, item.ref_id)}
                          </TableCell>
                          <TableCell className="text-right">{item.qty} {getUnitName(item.unit_id)}</TableCell>
                          <TableCell className="text-right">{(item.wastage_rate * 100).toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItemConfirm(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                        <h4 className="text-sm font-medium mb-2">明细成本</h4>
                        <div className="space-y-1">
                          {recipeCost.items.map((ci, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <span className="text-muted-foreground">{ci.material_name}</span>
                              <span className="font-mono">¥{ci.line_cost.toFixed(2)}</span>
                            </div>
                          ))}
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

      <Dialog open={!!addItemRecipeId} onOpenChange={() => setAddItemRecipeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加配方明細</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>類型</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={addItemType === "material" ? "default" : "outline"} onClick={() => { setAddItemType("material"); setAddItemMaterial(""); }}>原材料</Button>
                <Button size="sm" variant={addItemType === "sub_recipe" ? "default" : "outline"} onClick={() => { setAddItemType("sub_recipe"); setAddItemMaterial(""); }}>半成品（子配方）</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{addItemType === "sub_recipe" ? "子配方" : "材料"}</Label>
              <Select value={addItemMaterial} onValueChange={setAddItemMaterial}>
                <SelectTrigger><SelectValue placeholder={addItemType === "sub_recipe" ? "選擇子配方" : "選擇材料"} /></SelectTrigger>
                <SelectContent>
                  {addItemType === "sub_recipe"
                    ? recipes.filter((r) => r.id !== addItemRecipeId).map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.name} ({r.code})</SelectItem>
                      ))
                    : materials.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.code})</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用量</Label>
                <Input type="number" value={addItemQty} onChange={(e) => setAddItemQty(e.target.value)} placeholder="0.0" min="0.001" step="0.001" />
              </div>
              <div className="space-y-2">
                <Label>單位</Label>
                <Select value={addItemUnit} onValueChange={setAddItemUnit}>
                  <SelectTrigger><SelectValue placeholder="選擇單位" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>損耗率 (%)</Label>
              <Input type="number" value={addItemWastage} onChange={(e) => setAddItemWastage(e.target.value)} placeholder="0" min="0" max="100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemRecipeId(null)}>取消</Button>
            <Button onClick={saveAddItem} disabled={!addItemMaterial || !addItemQty || !addItemUnit}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
