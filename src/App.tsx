import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { DashboardPage } from "@/pages/dashboard-page";
import { MaterialsPage } from "@/pages/materials-page";
import { RecipesPage } from "@/pages/recipes-page";
import { InventoryPage } from "@/pages/inventory-page";
import { MenuPage } from "@/pages/menu-page";
import { OrdersPage } from "@/pages/orders-page";
import { POSPage } from "@/pages/pos-page";
import { SuppliersPage } from "@/pages/suppliers-page";
import { KDSPage } from "@/pages/kds-page";
import { AttributesPage } from "@/pages/attributes-page";
import { SettingsPage } from "@/pages/settings-page";
import { MaterialStatesPage } from "@/pages/material-states-page";
import { PurchaseOrdersPage } from "@/pages/purchase-orders-page";
import { ProductionOrdersPage } from "@/pages/production-orders-page";
import { StocktakesPage } from "@/pages/stocktakes-page";
import { ReportsPage } from "@/pages/reports-page";
import { PrintTemplatesPage } from "@/pages/print-templates-page";
import { PrintPreviewPage } from "@/pages/print-preview-page";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

// ==================== 类型定义 ====================

interface Unit { id: number; code: string; name: string; }
interface MaterialCategory { id: number; code: string; name: string; }
interface TagItem { id: number; code: string; name: string; color?: string; }
interface Material {
  id: number; code: string; name: string; category_id: number | null;
  base_unit_id: number; tags: TagItem[]; category?: MaterialCategory; base_unit?: Unit;
}
interface Recipe { id: number; code: string; name: string; recipe_type: string; output_qty: number; }
interface RecipeItem { id: number; recipe_id: number; item_type: string; ref_id: number; qty: number; unit_id: number; wastage_rate: number; note: string | null; sort_no: number; }
interface RecipeWithItems { recipe: Recipe; items: RecipeItem[]; }
interface RecipeCostItem { material_name: string; qty: number; unit: string; cost_per_unit: number; wastage_rate: number; line_cost: number; }
interface RecipeCostResult { recipe_id: number; recipe_name: string; total_cost: number; cost_per_unit: number; output_qty: number; items: RecipeCostItem[]; }
interface MenuItem { id: number; name: string; sales_price: number; is_available: boolean; recipe_id: number | null; category_id: number | null; }
interface MenuCategory { id: number; name: string; }
interface OrderItem { id: number; order_id: number; menu_item_id: number; spec_code: string | null; qty: number; unit_price: number; note: string | null; }
interface OrderItemModifier { id: number; order_item_id: number; modifier_type: string; material_id: number | null; material_name: string | null; qty: number; price_delta: number; }
interface Order { id: number; order_no: string; source: string; dine_type: string; table_no: string | null; status: string; amount_total: number; note: string | null; created_at: string; updated_at: string; }
interface OrderWithItems { order: Order; items: OrderItem[]; }
interface MenuItemSpec { id: number; menu_item_id: number; spec_code: string; spec_name: string; price_delta: number; qty_multiplier: number; }
interface POSCartItem { menu_item: MenuItem; spec: MenuItemSpec | null; qty: number; note: string; }
interface KitchenStation { id: number; code: string; name: string; station_type: string; }
interface TicketWithItems { id: number; order_id: number; station_id: number; status: string; priority: number; printed_at: string | null; started_at: string | null; finished_at: string | null; created_at: string; order_no: string; dine_type: string; table_no: string | null; items: OrderItem[]; }
interface InventoryBatch { id: number; material_id: number; lot_no: string; quantity: number; cost_per_unit: number; expiry_date: string | null; supplier_id: number | null; }
interface InventorySummary { material_id: number; material_name: string; total_qty: number; reserved_qty: number; available_qty: number; }
interface AttributeTemplate { id: number; entity_type: string; category: string | null; attr_code: string; attr_name: string; data_type: string; unit: string | null; default_value: number | null; formula: string | null; }
interface InventoryTxn { id: number; txn_no: string; txn_type: string; ref_type: string | null; ref_id: number | null; lot_id: number | null; material_id: number; qty_delta: number; created_at: string; }
interface Supplier { id: number; name: string; phone: string | null; contact_person: string | null; address: string | null; note: string | null; }
interface MaterialState { id: number; material_id: number; state_code: string; state_name: string; unit_id: number | null; yield_rate: number; cost_multiplier: number; is_active: boolean; }
interface PurchaseOrder { id: number; po_no: string; supplier_id: number | null; supplier_name: string | null; status: string; expected_date: string | null; total_cost: number; created_at: string; }
interface PurchaseOrderItem { id: number; po_id: number; material_id: number; material_name: string | null; qty: number; unit_id: number | null; unit_name: string | null; cost_per_unit: number; received_qty: number; }
interface PurchaseOrderWithItems { order: PurchaseOrder; items: PurchaseOrderItem[]; }
interface ProductionOrder { id: number; production_no: string; recipe_id: number; recipe_name: string | null; status: string; planned_qty: number; actual_qty: number | null; operator: string | null; started_at: string | null; completed_at: string | null; created_at: string; }
interface ProductionOrderItem { id: number; production_id: number; material_id: number; material_name: string | null; lot_id: number | null; planned_qty: number; actual_qty: number | null; }
interface ProductionOrderWithItems { order: ProductionOrder; items: ProductionOrderItem[]; }
interface Stocktake { id: number; stocktake_no: string; status: string; operator: string | null; note: string | null; created_at: string; completed_at: string | null; }
interface StocktakeItem { id: number; stocktake_id: number; lot_id: number | null; material_id: number; material_name: string | null; system_qty: number; actual_qty: number; diff_qty: number | null; note: string | null; }
interface StocktakeWithItems { stocktake: Stocktake; items: StocktakeItem[]; }

// ==================== 主应用 ====================

function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithItems | null>(null);
  const [recipeCost, setRecipeCost] = useState<RecipeCostResult | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [_stations, setStations] = useState<KitchenStation[]>([]);
  const [kdsTickets, setKdsTickets] = useState<TicketWithItems[]>([]);
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatch[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([]);
  const [inventoryTxns, setInventoryTxns] = useState<InventoryTxn[]>([]);
  const [attributeTemplates, setAttributeTemplates] = useState<AttributeTemplate[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialStates, setMaterialStates] = useState<MaterialState[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderWithItems | null>(null);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<ProductionOrderWithItems | null>(null);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [selectedStocktake, setSelectedStocktake] = useState<StocktakeWithItems | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const result = await invoke<string>("health_check");
      setConnected(result === "ok");
      try { await invoke("check_and_create_alerts"); } catch { /* ignore alert check errors */ }
      setUnits(await invoke<Unit[]>("get_units"));
      setCategories(await invoke<MaterialCategory[]>("get_material_categories"));
      setTags(await invoke<TagItem[]>("get_tags"));
      setMaterials(await invoke<Material[]>("get_materials"));
      setRecipes(await invoke<Recipe[]>("get_recipes"));
      setMenuCategories(await invoke<MenuCategory[]>("get_menu_categories"));
      setMenuItems(await invoke<MenuItem[]>("get_menu_items"));
      setOrders(await invoke<Order[]>("get_orders"));
      setStations(await invoke<KitchenStation[]>("get_kitchen_stations"));
      setInventoryBatches(await invoke<InventoryBatch[]>("get_inventory_batches"));
      setInventorySummary(await invoke<InventorySummary[]>("get_inventory_summary"));
      setInventoryTxns(await invoke<InventoryTxn[]>("get_inventory_txns", { limit: 50 }));
      setAttributeTemplates(await invoke<AttributeTemplate[]>("get_attribute_templates"));
      setSuppliers(await invoke<Supplier[]>("get_suppliers"));
      setMaterialStates(await invoke<MaterialState[]>("get_all_material_states"));
      setPurchaseOrders(await invoke<PurchaseOrder[]>("get_purchase_orders"));
      setProductionOrders(await invoke<ProductionOrder[]>("get_production_orders"));
      setStocktakes(await invoke<Stocktake[]>("get_stocktakes"));
      const pendingTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "pending" });
      const startedTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "started" });
      setKdsTickets([...pendingTickets, ...startedTickets]);
    } catch (e) {
      toast.error("连接失败", { description: String(e) });
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMaterial(data: { code: string; name: string; base_unit_id: number; category_id: number | null; tag_ids: number[] }) {
    try { await invoke("create_material", { req: { code: data.code, name: data.name, base_unit_id: data.base_unit_id, category_id: data.category_id, shelf_life_days: null, tag_ids: data.tag_ids } }); toast.success("材料已创建", { description: data.name }); loadData(); }
    catch (e) { toast.error("创建材料失败", { description: String(e) }); }
  }

  async function handleUpdateMaterial(id: number, data: { name?: string; category_id?: number | null }) {
    try { await invoke("update_material", { id, name: data.name || null, categoryId: data.category_id, shelfLifeDays: null }); toast.success("材料已更新"); loadData(); }
    catch (e) { toast.error("更新材料失败", { description: String(e) }); }
  }

  async function handleDeleteMaterial(id: number) {
    setConfirmAction({ title: "确认删除材料", description: "删除后无法恢复，确定要删除此材料吗？", onConfirm: async () => { try { await invoke("delete_material", { id }); toast.success("材料已删除"); loadData(); } catch (e) { toast.error("删除材料失败", { description: String(e) }); } } });
  }

  async function handleRemoveMaterialTag(material_id: number, tag_id: number) {
    try { await invoke("remove_material_tag", { materialId: material_id, tagId: tag_id }); loadData(); }
    catch (e) { toast.error("移除标签失败", { description: String(e) }); }
  }

  async function handleCreateCategory(data: { code: string; name: string }) {
    try { await invoke("create_material_category", { req: { ...data, sort_no: categories.length + 1 } }); toast.success("分类已创建", { description: data.name }); loadData(); }
    catch (e) { toast.error("创建分类失败", { description: String(e) }); }
  }

  async function handleDeleteCategory(id: number) {
    setConfirmAction({ title: "确认删除分类", description: "删除后无法恢复，确定要删除此分类吗？", onConfirm: async () => { try { await invoke("delete_material_category", { id }); toast.success("分类已删除"); loadData(); } catch (e) { toast.error("删除分类失败", { description: String(e) }); } } });
  }

  async function handleCreateTag(data: { code: string; name: string; color?: string }) {
    try { await invoke("create_tag", { req: { ...data, color: data.color || null } }); toast.success("标签已创建", { description: data.name }); loadData(); }
    catch (e) { toast.error("创建标签失败", { description: String(e) }); }
  }

  async function handleDeleteTag(id: number) {
    setConfirmAction({ title: "确认删除标签", description: "删除后无法恢复，确定要删除此标签吗？", onConfirm: async () => { try { await invoke("delete_tag", { id }); toast.success("标签已删除"); loadData(); } catch (e) { toast.error("删除标签失败", { description: String(e) }); } } });
  }

  async function handleCreateRecipe(data: { code: string; name: string }) {
    try {
      await invoke("create_recipe", { req: { ...data, recipe_type: "menu", output_qty: 1.0, output_material_id: null, output_state_id: null, output_unit_id: null, items: null } });
      toast.success("配方已创建", { description: data.name });
      loadData();
    } catch (e) { toast.error("创建配方失败", { description: String(e) }); }
  }

  async function handleViewRecipe(recipe: Recipe) {
    try {
      const data = await invoke<RecipeWithItems>("get_recipe_with_items", { recipeId: recipe.id });
      setSelectedRecipe(data);
      const cost = await invoke<RecipeCostResult>("calculate_recipe_cost", { recipeId: recipe.id });
      setRecipeCost(cost);
    } catch (e) { toast.error("加载配方失败", { description: String(e) }); }
  }

  async function handleDeleteRecipe(id: number) {
    setConfirmAction({ title: "确认删除配方", description: "删除后无法恢复，确定要删除此配方吗？", onConfirm: async () => { try { await invoke("delete_recipe", { id }); toast.success("配方已删除"); setSelectedRecipe(null); setRecipeCost(null); loadData(); } catch (e) { toast.error("删除配方失败", { description: String(e) }); } } });
  }

  async function handleUpdateRecipe(id: number, name: string, output_qty: number) {
    try { await invoke("update_recipe", { id, name, outputQty: output_qty }); toast.success("配方已更新"); loadData(); }
    catch (e) { toast.error("更新配方失败", { description: String(e) }); }
  }

  async function handleAddRecipeItem(recipe_id: number, item_type: string, ref_id: number, qty: number, unit_id: number, wastage_rate: number) {
    try {
      await invoke("add_recipe_item", { recipeId: recipe_id, req: { item_type, ref_id, qty, unit_id, wastage_rate } });
      toast.success("配方项已添加");
      if (selectedRecipe?.recipe.id === recipe_id) { handleViewRecipe({ id: recipe_id, code: "", name: "", recipe_type: "", output_qty: 0 }); }
    } catch (e) { toast.error("添加配方项失败", { description: String(e) }); }
  }

  async function handleDeleteRecipeItem(item_id: number, recipe_id: number) {
    setConfirmAction({ title: "确认删除配方项", description: "删除后无法恢复，确定要删除此配方项吗？", onConfirm: async () => { try { await invoke("delete_recipe_item", { itemId: item_id }); toast.success("配方项已删除"); if (selectedRecipe?.recipe.id === recipe_id) { handleViewRecipe({ id: recipe_id, code: "", name: "", recipe_type: "", output_qty: 0 }); } } catch (e) { toast.error("删除配方项失败", { description: String(e) }); } } });
  }

  async function handleRecalculateCost(recipe_id: number) {
    try {
      const cost = await invoke<RecipeCostResult>("calculate_recipe_cost", { recipeId: recipe_id });
      setRecipeCost(cost);
    } catch (e) { toast.error("计算成本失败", { description: String(e) }); }
  }

  async function handleCreateMenuCategory(name: string) {
    try { await invoke("create_menu_category", { name, sortNo: menuCategories.length + 1 }); toast.success("菜单分类已创建", { description: name }); loadData(); }
    catch (e) { toast.error("创建菜单分类失败", { description: String(e) }); }
  }

  async function handleCreateMenuItemFull(data: { name: string; price: number; category_id: number | null; recipe_id: number | null }) {
    try { await invoke("create_menu_item", { req: { name: data.name, category_id: data.category_id, recipe_id: data.recipe_id, sales_price: data.price } }); toast.success("菜品已添加", { description: data.name }); loadData(); }
    catch (e) { toast.error("添加菜品失败", { description: String(e) }); }
  }

  async function handleToggleMenuItem(id: number, is_available: boolean) {
    try { await invoke("toggle_menu_item_availability", { id, isAvailable: is_available }); loadData(); }
    catch (e) { toast.error("切换菜品状态失败", { description: String(e) }); }
  }

  async function handleUpdateMenuItem(id: number, data: { name?: string; category_id?: number | null; recipe_id?: number | null; sales_price?: number }) {
    try { await invoke("update_menu_item", { id, name: data.name || null, categoryId: data.category_id, recipeId: data.recipe_id, salesPrice: data.sales_price }); toast.success("菜品已更新"); loadData(); }
    catch (e) { toast.error("更新菜品失败", { description: String(e) }); }
  }

  async function handleDeleteMenuItem(id: number) {
    setConfirmAction({ title: "确认删除菜品", description: "删除后无法恢复，确定要删除此菜品吗？", onConfirm: async () => { try { await invoke("delete_menu_item", { id }); toast.success("菜品已删除"); loadData(); } catch (e) { toast.error("删除菜品失败", { description: String(e) }); } } });
  }

  async function handleUpdateMenuCategory(id: number, name: string) {
    try { await invoke("update_menu_category", { id, name, sortNo: 0 }); toast.success("分类已更新"); loadData(); }
    catch (e) { toast.error("更新分类失败", { description: String(e) }); }
  }

  async function handleDeleteMenuCategory(id: number) {
    setConfirmAction({ title: "确认删除菜单分类", description: "删除后无法恢复，确定要删除此分类吗？", onConfirm: async () => { try { await invoke("delete_menu_category", { id }); toast.success("分类已删除"); loadData(); } catch (e) { toast.error("删除分类失败", { description: String(e) }); } } });
  }

  async function handleCreateOrder() {
    try {
      await invoke("create_order", { req: { source: "pos", dine_type: "dine_in", table_no: null } });
      toast.success("订单已创建");
      loadData();
    } catch (e) { toast.error("创建订单失败", { description: String(e) }); }
  }

  async function handlePOSOrder(cart: POSCartItem[]) {
    try {
      const orderNo = await invoke<string>("create_order", { req: { source: "pos", dine_type: "dine_in", table_no: null } });
      const orderId = parseInt(orderNo.replace("ORD", ""));
      for (const item of cart) {
        await invoke("add_order_item", {
          req: {
            order_id: orderId,
            menu_item_id: item.menu_item.id,
            qty: item.qty,
            unit_price: item.menu_item.sales_price + (item.spec?.price_delta || 0),
            spec_code: item.spec?.spec_code || null,
            note: item.note || null,
          },
        });
      }
      toast.success("订单已创建");
      loadData();
      return true;
    } catch (e) { toast.error("创建订单失败", { description: String(e) }); return false; }
  }

  async function handlePOSAndSubmit(cart: POSCartItem[]) {
    try {
      const orderNo = await invoke<string>("create_order", { req: { source: "pos", dine_type: "dine_in", table_no: null } });
      const orderId = parseInt(orderNo.replace("ORD", ""));
      const printItems: [string, number, string | null][] = cart.map((item) => [
        item.menu_item.name,
        item.qty,
        item.note || null,
      ]);
      for (const item of cart) {
        await invoke("add_order_item", {
          req: {
            order_id: orderId,
            menu_item_id: item.menu_item.id,
            qty: item.qty,
            unit_price: item.menu_item.sales_price + (item.spec?.price_delta || 0),
            spec_code: item.spec?.spec_code || null,
            note: item.note || null,
          },
        });
      }
      await invoke("submit_order", { orderId });
      try {
        await invoke("print_kitchen_ticket", {
          orderNo,
          dineType: "堂食",
          items: printItems,
          note: null,
          printerId: null,
        });
      } catch (pe) {
        console.warn("打印厨房单失败:", pe);
      }
      toast.success("订单已提交");
      loadData();
      return true;
    } catch (e) { toast.error("提交订单失败", { description: String(e) }); return false; }
  }

  async function handleGetSpecs(menuItemId: number) {
    return await invoke<MenuItemSpec[]>("get_menu_item_specs", { menuItemId });
  }

  async function handleCreateSpec(data: { menu_item_id: number; spec_code: string; spec_name: string; price_delta: number; qty_multiplier: number }) {
    try { await invoke("create_menu_item_spec", { req: { menu_item_id: data.menu_item_id, spec_code: data.spec_code, spec_name: data.spec_name, price_delta: data.price_delta, qty_multiplier: data.qty_multiplier } }); toast.success("规格已创建"); }
    catch (e) { toast.error("创建规格失败", { description: String(e) }); }
  }

  async function handleUpdateSpec(id: number, data: { spec_code?: string; spec_name?: string; price_delta?: number; qty_multiplier?: number }) {
    try { await invoke("update_menu_item_spec", { id, specCode: data.spec_code || null, specName: data.spec_name || null, priceDelta: data.price_delta, qtyMultiplier: data.qty_multiplier }); toast.success("规格已更新"); }
    catch (e) { toast.error("更新规格失败", { description: String(e) }); }
  }

  async function handleDeleteSpec(id: number) {
    setConfirmAction({ title: "确认删除规格", description: "删除后无法恢复，确定要删除此规格吗？", onConfirm: async () => { try { await invoke("delete_menu_item_spec", { id }); toast.success("规格已删除"); } catch (e) { toast.error("删除规格失败", { description: String(e) }); } } });
  }

  async function handleCreateSupplier(data: { name: string; phone: string; contact_person: string; address: string; note: string }) {
    try {
      await invoke("create_supplier", { req: { name: data.name, phone: data.phone || null, contact_person: data.contact_person || null } });
      toast.success("供应商已创建", { description: data.name });
      loadData();
    } catch (e) { toast.error("创建供应商失败", { description: String(e) }); }
  }

  async function handleUpdateSupplier(id: number, data: { name?: string; phone?: string | null; contact_person?: string | null; address?: string | null; note?: string | null }) {
    try { await invoke("update_supplier", { id, name: data.name || null, phone: data.phone, contactPerson: data.contact_person, address: data.address, note: data.note }); toast.success("供应商已更新"); loadData(); }
    catch (e) { toast.error("更新供应商失败", { description: String(e) }); }
  }

  async function handleDeleteSupplier(id: number) {
    setConfirmAction({ title: "确认删除供应商", description: "删除后无法恢复，确定要删除此供应商吗？", onConfirm: async () => { try { await invoke("delete_supplier", { id }); toast.success("供应商已删除"); loadData(); } catch (e) { toast.error("删除供应商失败", { description: String(e) }); } } });
  }

  async function handleCreateMaterialState(data: { material_id: number; state_code: string; state_name: string; unit_id: number | null; yield_rate: number; cost_multiplier: number }) {
    try { await invoke("create_material_state", { req: { material_id: data.material_id, state_code: data.state_code, state_name: data.state_name, unit_id: data.unit_id, yield_rate: data.yield_rate, cost_multiplier: data.cost_multiplier } }); toast.success("材料状态已创建"); loadData(); }
    catch (e) { toast.error("创建材料状态失败", { description: String(e) }); }
  }

  async function handleUpdateMaterialState(id: number, data: { state_code?: string; state_name?: string; unit_id?: number | null; yield_rate?: number; cost_multiplier?: number }) {
    try { await invoke("update_material_state", { id, stateCode: data.state_code || null, stateName: data.state_name || null, unitId: data.unit_id, yieldRate: data.yield_rate, costMultiplier: data.cost_multiplier }); toast.success("材料状态已更新"); loadData(); }
    catch (e) { toast.error("更新材料状态失败", { description: String(e) }); }
  }

  async function handleDeleteMaterialState(id: number) {
    setConfirmAction({ title: "确认删除材料状态", description: "删除后无法恢复，确定要删除此状态吗？", onConfirm: async () => { try { await invoke("delete_material_state", { id }); toast.success("材料状态已删除"); loadData(); } catch (e) { toast.error("删除材料状态失败", { description: String(e) }); } } });
  }

  async function handleCreatePurchaseOrder(data: { supplier_id: number | null; expected_date: string | null }) {
    try { await invoke("create_purchase_order", { supplierId: data.supplier_id, expectedDate: data.expected_date }); toast.success("采购单已创建"); loadData(); }
    catch (e) { toast.error("创建采购单失败", { description: String(e) }); }
  }

  async function handleAddPurchaseOrderItem(data: { po_id: number; material_id: number; qty: number; unit_id: number | null; cost_per_unit: number }) {
    try { await invoke("add_purchase_order_item", { req: data }); toast.success("采购项已添加"); loadData(); }
    catch (e) { toast.error("添加采购项失败", { description: String(e) }); }
  }

  async function handleViewPurchaseOrder(po_id: number) {
    try { setSelectedPurchaseOrder(await invoke<PurchaseOrderWithItems>("get_purchase_order_with_items", { poId: po_id })); }
    catch (e) { toast.error("加载采购单失败", { description: String(e) }); }
  }

  async function handleDeletePurchaseOrder(po_id: number) {
    setConfirmAction({ title: "确认删除采购单", description: "删除后无法恢复，确定要删除此采购单吗？", onConfirm: async () => { try { await invoke("delete_purchase_order", { poId: po_id }); toast.success("采购单已删除"); loadData(); setSelectedPurchaseOrder(null); } catch (e) { toast.error("删除采购单失败", { description: String(e) }); } } });
  }

  async function handleReceivePurchaseOrder(po_id: number) {
    try { await invoke("receive_purchase_order", { poId: po_id, operator: null }); toast.success("采购单已入库"); loadData(); }
    catch (e) { toast.error("入库失败", { description: String(e) }); }
  }

  async function handleCreateProductionOrder(data: { recipe_id: number; planned_qty: number; operator: string | null }) {
    try { await invoke("create_production_order", { recipeId: data.recipe_id, plannedQty: data.planned_qty, operator: data.operator }); toast.success("生产单已创建"); loadData(); }
    catch (e) { toast.error("创建生产单失败", { description: String(e) }); }
  }

  async function handleStartProductionOrder(production_id: number) {
    try { await invoke("start_production_order", { productionId: production_id, operator: null }); toast.success("生产已开始"); loadData(); }
    catch (e) { toast.error("开始生产失败", { description: String(e) }); }
  }

  async function handleCompleteProductionOrder(production_id: number, actual_qty: number) {
    try { await invoke("complete_production_order", { productionId: production_id, actualQty: actual_qty, operator: null }); toast.success("生产已完成"); loadData(); }
    catch (e) { toast.error("完成生产失败", { description: String(e) }); }
  }

  async function handleViewProductionOrder(production_id: number) {
    try { setSelectedProductionOrder(await invoke<ProductionOrderWithItems>("get_production_order_with_items", { productionId: production_id })); }
    catch (e) { toast.error("加载生产单失败", { description: String(e) }); }
  }

  async function handleDeleteProductionOrder(production_id: number) {
    setConfirmAction({ title: "确认删除生产单", description: "删除后无法恢复，确定要删除此生产单吗？", onConfirm: async () => { try { await invoke("delete_production_order", { productionId: production_id }); toast.success("生产单已删除"); loadData(); setSelectedProductionOrder(null); } catch (e) { toast.error("删除生产单失败", { description: String(e) }); } } });
  }

  async function handleCreateStocktake(data: { operator: string | null; note: string | null }) {
    try { await invoke("create_stocktake", { operator: data.operator, note: data.note }); toast.success("盘点已创建"); loadData(); }
    catch (e) { toast.error("创建盘点失败", { description: String(e) }); }
  }

  async function handleUpdateStocktakeItem(item_id: number, actual_qty: number) {
    try { await invoke("update_stocktake_item", { itemId: item_id, actualQty: actual_qty }); loadData(); }
    catch (e) { toast.error("更新盘点项失败", { description: String(e) }); }
  }

  async function handleCompleteStocktake(stocktake_id: number) {
    try { await invoke("complete_stocktake", { stocktakeId: stocktake_id, operator: null }); toast.success("盘点已完成"); loadData(); }
    catch (e) { toast.error("完成盘点失败", { description: String(e) }); }
  }

  async function handleViewStocktake(stocktake_id: number) {
    try { setSelectedStocktake(await invoke<StocktakeWithItems>("get_stocktake_with_items", { stocktakeId: stocktake_id })); }
    catch (e) { toast.error("加载盘点失败", { description: String(e) }); }
  }

  async function handleDeleteStocktake(stocktake_id: number) {
    setConfirmAction({ title: "确认删除盘点", description: "删除后无法恢复，确定要删除此盘点吗？", onConfirm: async () => { try { await invoke("delete_stocktake", { stocktakeId: stocktake_id }); toast.success("盘点已删除"); loadData(); setSelectedStocktake(null); } catch (e) { toast.error("删除盘点失败", { description: String(e) }); } } });
  }

  async function handleCreateBatch(data: { material_id: number; lot_no: string; quantity: number; cost_per_unit: number; supplier_id: number | null; expiry_date: string | null; production_date: string | null }) {
    try {
      await invoke("create_inventory_batch", { req: { material_id: data.material_id, state_id: null, lot_no: data.lot_no, supplier_id: data.supplier_id, brand: null, spec: null, quantity: data.quantity, cost_per_unit: data.cost_per_unit, production_date: data.production_date, expiry_date: data.expiry_date, ice_coating_rate: null, quality_rate: null, seasonal_factor: 1.0 } });
      toast.success("批次已创建", { description: data.lot_no });
      const mat = materials.find((m) => m.id === data.material_id);
      const sup = suppliers.find((s) => s.id === data.supplier_id);
      try {
        await invoke("print_batch_label", {
          lotNo: data.lot_no,
          materialName: mat?.name || `材料 #${data.material_id}`,
          quantity: data.quantity,
          unit: "kg",
          expiryDate: data.expiry_date,
          supplierName: sup?.name || null,
          printerId: null,
        });
      } catch (pe) {
        console.warn("打印批次标签失败:", pe);
      }
      loadData();
    } catch (e) { toast.error("创建批次失败", { description: String(e) }); }
  }

  async function handleAdjustInventory(lot_id: number, qty_delta: number, reason: string) {
    try {
      const batch = inventoryBatches.find((b) => b.id === lot_id);
      if (!batch) return;
      await invoke("adjust_inventory", { req: { material_id: batch.material_id, lot_id, qty_delta, reason, operator: null, note: null } });
      toast.success("库存已调整");
      loadData();
    } catch (e) { toast.error("调整库存失败", { description: String(e) }); }
  }

  async function handleRecordWastage(lot_id: number, qty: number, wastage_type: string) {
    try {
      const batch = inventoryBatches.find((b) => b.id === lot_id);
      if (!batch) return;
      await invoke("record_wastage", { req: { material_id: batch.material_id, lot_id, qty, wastage_type, operator: null, note: null } });
      toast.success("废弃已记录");
      loadData();
    } catch (e) { toast.error("记录废弃失败", { description: String(e) }); }
  }

  async function handleDeleteBatch(batch_id: number) {
    setConfirmAction({ title: "确认删除批次", description: "删除后无法恢复，确定要删除此批次吗？", onConfirm: async () => { try { await invoke("delete_inventory_batch", { batchId: batch_id }); toast.success("批次已删除"); loadData(); } catch (e) { toast.error("删除批次失败", { description: String(e) }); } } });
  }

  async function handleSubmitOrder(orderId: number) {
    try {
      await invoke("submit_order", { orderId });
      toast.success("订单已提交");
      loadData();
    } catch (e) { toast.error("提交订单失败", { description: String(e) }); }
  }

  async function handleCancelOrder(orderId: number) {
    setConfirmAction({ title: "确认取消订单", description: "取消订单将回退已扣减的库存，确定要取消此订单吗？", onConfirm: async () => { try { await invoke("cancel_order", { orderId }); toast.success("订单已取消"); loadData(); } catch (e) { toast.error("取消订单失败", { description: String(e) }); } } });
  }

  async function handleViewOrder(orderId: number) {
    try {
      const data = await invoke<OrderWithItems>("get_order_with_items", { orderId });
      setSelectedOrder(data);
    } catch (e) { toast.error("加载订单失败", { description: String(e) }); }
  }

  async function handleFinishTicket(ticket: TicketWithItems) {
    try {
      await invoke("finish_ticket", { ticketId: ticket.id, operator: null });
      toast.success("工单已完成");
      try {
        const printItems: [string, number, string | null][] = ticket.items.map((item) => [
          menuItems.find((m) => m.id === item.menu_item_id)?.name || `菜品 #${item.menu_item_id}`,
          item.qty,
          item.note || null,
        ]);
        await invoke("print_kitchen_ticket", {
          orderNo: ticket.order_no,
          dineType: ticket.dine_type === "dine_in" ? "堂食" : ticket.dine_type === "takeout" ? "外卖" : "外送",
          items: printItems,
          note: null,
          printerId: null,
        });
      } catch (pe) {
        console.warn("打印出餐标签失败:", pe);
      }
      loadData();
    } catch (e) { toast.error("完成工单失败", { description: String(e) }); }
  }

  async function handleLoadKDS() {
    try {
      const pendingTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "pending" });
      const startedTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "started" });
      setKdsTickets([...pendingTickets, ...startedTickets]);
    } catch (e) { toast.error("加载KDS失败", { description: String(e) }); }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} connected={connected} />
          <SidebarInset className="flex flex-col">
            <AppHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={loadData} refreshing={loading} />
            <main className="flex-1 overflow-auto p-6">
              <div key={activeTab} className="animate-page-enter">
              {activeTab === "dashboard" && (
                <DashboardPage materialsCount={materials.length} recipesCount={recipes.length} ordersCount={orders.length} batchesCount={inventoryBatches.length} orders={orders} inventorySummary={inventorySummary} loading={loading} />
              )}
              {activeTab === "materials" && (
                <MaterialsPage materials={materials} categories={categories} tags={tags} units={units} onCreateMaterial={handleCreateMaterial} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} onRemoveMaterialTag={handleRemoveMaterialTag} onCreateCategory={handleCreateCategory} onDeleteCategory={handleDeleteCategory} onCreateTag={handleCreateTag} onDeleteTag={handleDeleteTag} searchQuery={searchQuery} />
              )}
              {activeTab === "recipes" && (
                <RecipesPage recipes={recipes} selectedRecipe={selectedRecipe} recipeCost={recipeCost} materials={materials} units={units} onCreateRecipe={handleCreateRecipe} onViewRecipe={handleViewRecipe} onDeleteRecipe={handleDeleteRecipe} onUpdateRecipe={handleUpdateRecipe} onAddRecipeItem={handleAddRecipeItem} onDeleteRecipeItem={handleDeleteRecipeItem} onRecalculateCost={handleRecalculateCost} searchQuery={searchQuery} />
              )}
              {activeTab === "inventory" && (
                <InventoryPage inventorySummary={inventorySummary} inventoryBatches={inventoryBatches} inventoryTxns={inventoryTxns} materials={materials} suppliers={suppliers} onCreateBatch={handleCreateBatch} onAdjustInventory={handleAdjustInventory} onRecordWastage={handleRecordWastage} onDeleteBatch={handleDeleteBatch} searchQuery={searchQuery} />
              )}
              {activeTab === "menu" && (
                <MenuPage menuCategories={menuCategories} menuItems={menuItems} recipes={recipes} onCreateMenuCategory={handleCreateMenuCategory} onCreateMenuItem={handleCreateMenuItemFull} onToggleAvailability={handleToggleMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} onUpdateMenuCategory={handleUpdateMenuCategory} onDeleteMenuCategory={handleDeleteMenuCategory} onGetSpecs={handleGetSpecs} onCreateSpec={handleCreateSpec} onUpdateSpec={handleUpdateSpec} onDeleteSpec={handleDeleteSpec} searchQuery={searchQuery} />
              )}
              {activeTab === "pos" && (
                <POSPage menuCategories={menuCategories} menuItems={menuItems} onCreateOrder={handlePOSOrder} onCreateAndSubmit={handlePOSAndSubmit} onGetSpecs={handleGetSpecs} searchQuery={searchQuery} loading={loading} />
              )}
              {activeTab === "suppliers" && (
                <SuppliersPage suppliers={suppliers} onCreateSupplier={handleCreateSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} searchQuery={searchQuery} />
              )}
              {activeTab === "orders" && (
                <OrdersPage orders={orders} selectedOrder={selectedOrder} menuItems={Object.fromEntries(menuItems.map((item) => [item.id, item.name]))} materials={materials} onCreateOrder={handleCreateOrder} onSubmitOrder={handleSubmitOrder} onCancelOrder={handleCancelOrder} onViewOrder={handleViewOrder} onAddModifier={async (data) => { try { await invoke("add_order_item_modifier", { req: data }); toast.success("加料已添加"); } catch (e) { toast.error("添加加料失败", { description: String(e) }); } }} onDeleteModifier={async (modifier_id) => { try { await invoke("delete_order_item_modifier", { modifierId: modifier_id }); toast.success("加料已删除"); } catch (e) { toast.error("删除加料失败", { description: String(e) }); } }} onLoadModifiers={async (order_item_id) => { return await invoke<OrderItemModifier[]>("get_order_item_modifiers", { orderItemId: order_item_id }); }} searchQuery={searchQuery} />
              )}
              {activeTab === "kds" && (
                <KDSPage allTickets={kdsTickets} onStartTicket={async (id) => { try { await invoke("start_ticket", { ticketId: id, operator: null }); toast.success("工单已开始"); loadData(); } catch (e) { toast.error("开始工单失败", { description: String(e) }); } }} onFinishTicket={async (id) => { const ticket = kdsTickets.find((t) => t.id === id); if (ticket) { await handleFinishTicket(ticket); } else { await invoke("finish_ticket", { ticketId: id, operator: null }); toast.success("工单已完成"); loadData(); } }} onRefresh={handleLoadKDS} />
              )}
              {activeTab === "attributes" && (
                <AttributesPage attributeTemplates={attributeTemplates} />
              )}
              {activeTab === "settings" && <SettingsPage connected={connected} />}
              {activeTab === "material-states" && (
                <MaterialStatesPage materialStates={materialStates} materials={materials} units={units} onCreateState={handleCreateMaterialState} onUpdateState={handleUpdateMaterialState} onDeleteState={handleDeleteMaterialState} searchQuery={searchQuery} />
              )}
              {activeTab === "purchase-orders" && (
                <PurchaseOrdersPage orders={purchaseOrders} materials={materials} units={units} suppliers={suppliers} onCreateOrder={handleCreatePurchaseOrder} onAddItem={handleAddPurchaseOrderItem} onViewOrder={handleViewPurchaseOrder} onDeleteOrder={handleDeletePurchaseOrder} onReceiveOrder={handleReceivePurchaseOrder} selectedOrder={selectedPurchaseOrder} searchQuery={searchQuery} />
              )}
              {activeTab === "production-orders" && (
                <ProductionOrdersPage orders={productionOrders} recipes={recipes} onCreateOrder={handleCreateProductionOrder} onStartOrder={handleStartProductionOrder} onCompleteOrder={handleCompleteProductionOrder} onViewOrder={handleViewProductionOrder} onDeleteOrder={handleDeleteProductionOrder} selectedOrder={selectedProductionOrder} searchQuery={searchQuery} />
              )}
              {activeTab === "stocktakes" && (
                <StocktakesPage stocktakes={stocktakes} onCreateStocktake={handleCreateStocktake} onUpdateItem={handleUpdateStocktakeItem} onCompleteStocktake={handleCompleteStocktake} onViewStocktake={handleViewStocktake} onDeleteStocktake={handleDeleteStocktake} selectedStocktake={selectedStocktake} searchQuery={searchQuery} />
              )}
              {activeTab === "reports" && <ReportsPage />}
              {activeTab === "print-templates" && <PrintTemplatesPage />}
              {activeTab === "print-preview" && <PrintPreviewPage />}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Toaster />
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </TooltipProvider>
  );
}

export default App;
