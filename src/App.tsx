import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import { PrintSettingsPage } from "@/pages/print-settings-page";
import { PrintPreviewPage } from "@/pages/print-preview-page";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { toast } from "sonner";
import type {
  Unit, MaterialCategory, TagItem, Material, Recipe,
  RecipeWithItems, RecipeCostResult, MenuItem, MenuCategory, OrderItemModifier,
  Order, OrderWithItems, MenuItemSpec, POSCartItem, KitchenStation, TicketWithItems,
  InventoryBatch, InventorySummary, AttributeTemplate, InventoryTxn, Supplier, MaterialState,
  PurchaseOrder, PurchaseOrderWithItems, ProductionOrder, ProductionOrderWithItems, Stocktake, StocktakeWithItems
} from "./types";

// ==================== App ====================

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.slice(1) || "dashboard";
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
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [stations, setStations] = useState<KitchenStation[]>([]);
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
      const fetchedOrders = await invoke<Order[]>("get_orders", { limit: 200, offset: 0 });
      setOrders(fetchedOrders);
      setOrdersHasMore(fetchedOrders.length === 200);
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

  async function handleBatchToggleMenuItem(ids: number[], is_available: boolean) {
    try { 
      const count = await invoke<number>("batch_toggle_menu_item_availability", { ids, isAvailable: is_available }); 
      toast.success(`已批量切换 ${count} 个菜品`); 
      loadData(); 
    }
    catch (e) { toast.error("批量切换失败", { description: String(e) }); }
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

  async function handleLoadMoreOrders() {
    try {
      const more = await invoke<Order[]>("get_orders", { limit: 200, offset: orders.length });
      setOrders((prev) => [...prev, ...more]);
      setOrdersHasMore(more.length === 200);
    } catch (e) { toast.error("載入訂單失敗", { description: String(e) }); }
  }

  async function handleCreateOrder() {
    try {
      await invoke("create_order", { req: { source: "pos", dine_type: "dine_in", table_no: null } });
      toast.success("订单已创建");
      loadData();
    } catch (e) { toast.error("创建订单失败", { description: String(e) }); }
  }

  async function handlePOSOrder(cart: POSCartItem[], dineType: string = "dine_in", tableNo: string | null = null) {
    try {
      const { id: orderId } = await invoke<{ id: number; order_no: string }>("create_order", { req: { source: "pos", dine_type: dineType, table_no: tableNo } });
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

  async function handlePOSAndSubmit(cart: POSCartItem[], dineType: string = "dine_in", tableNo: string | null = null) {
    try {
      const { id: orderId, order_no: orderNo } = await invoke<{ id: number; order_no: string }>("create_order", { req: { source: "pos", dine_type: dineType, table_no: tableNo } });
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
        const dineTypeLabel = dineType === "dine_in" ? "堂食" : dineType === "takeout" ? "外帶" : "外送";
        await invoke("print_kitchen_ticket", {
          orderNo,
          dineType: dineTypeLabel,
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
      const unitCode = mat?.base_unit?.code || units.find((u) => u.id === mat?.base_unit_id)?.code || "";
      try {
        await invoke("print_batch_label", {
          lotNo: data.lot_no,
          materialName: mat?.name || `材料 #${data.material_id}`,
          quantity: data.quantity,
          unit: unitCode,
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

  async function handleBatchCancelOrder(ids: number[]) {
    setConfirmAction({ title: "批量取消订单", description: `确定要取消 ${ids.length} 个订单吗？取消后将回退已扣减的库存。`, onConfirm: async () => { try { const count = await invoke<number>("batch_cancel_orders", { ids }); toast.success(`已取消 ${count} 个订单`); loadData(); } catch (e) { toast.error("批量取消失败", { description: String(e) }); } } });
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
    <ErrorBoundary>
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar activeTab={activeTab} onTabChange={(tab) => navigate("/" + tab)} connected={connected} />
          <SidebarInset className="flex flex-col">
            <AppHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={loadData} refreshing={loading} />
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage materialsCount={materials.length} recipesCount={recipes.length} ordersCount={orders.length} batchesCount={inventoryBatches.length} orders={orders} inventorySummary={inventorySummary} loading={loading} />} />
                <Route path="/materials" element={<MaterialsPage materials={materials} categories={categories} tags={tags} units={units} onCreateMaterial={handleCreateMaterial} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} onRemoveMaterialTag={handleRemoveMaterialTag} onCreateCategory={handleCreateCategory} onDeleteCategory={handleDeleteCategory} onCreateTag={handleCreateTag} onDeleteTag={handleDeleteTag} searchQuery={searchQuery} />} />
                <Route path="/recipes" element={<RecipesPage recipes={recipes} selectedRecipe={selectedRecipe} recipeCost={recipeCost} materials={materials} units={units} onCreateRecipe={handleCreateRecipe} onViewRecipe={handleViewRecipe} onDeleteRecipe={handleDeleteRecipe} onUpdateRecipe={handleUpdateRecipe} onAddRecipeItem={handleAddRecipeItem} onDeleteRecipeItem={handleDeleteRecipeItem} onRecalculateCost={handleRecalculateCost} searchQuery={searchQuery} />} />
                <Route path="/inventory" element={<InventoryPage inventorySummary={inventorySummary} inventoryBatches={inventoryBatches} inventoryTxns={inventoryTxns} materials={materials} suppliers={suppliers} onCreateBatch={handleCreateBatch} onAdjustInventory={handleAdjustInventory} onRecordWastage={handleRecordWastage} onDeleteBatch={handleDeleteBatch} searchQuery={searchQuery} />} />
                <Route path="/menu" element={<MenuPage menuCategories={menuCategories} menuItems={menuItems} recipes={recipes} onCreateMenuCategory={handleCreateMenuCategory} onCreateMenuItem={handleCreateMenuItemFull} onToggleAvailability={handleToggleMenuItem} onBatchToggleAvailability={handleBatchToggleMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} onUpdateMenuCategory={handleUpdateMenuCategory} onDeleteMenuCategory={handleDeleteMenuCategory} onGetSpecs={handleGetSpecs} onCreateSpec={handleCreateSpec} onUpdateSpec={handleUpdateSpec} onDeleteSpec={handleDeleteSpec} searchQuery={searchQuery} />} />
                <Route path="/pos" element={<POSPage menuCategories={menuCategories} menuItems={menuItems} onCreateOrder={handlePOSOrder} onCreateAndSubmit={handlePOSAndSubmit} onGetSpecs={handleGetSpecs} searchQuery={searchQuery} loading={loading} />} />
                <Route path="/suppliers" element={<SuppliersPage suppliers={suppliers} onCreateSupplier={handleCreateSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} searchQuery={searchQuery} />} />
                <Route path="/orders" element={<OrdersPage orders={orders} selectedOrder={selectedOrder} menuItems={Object.fromEntries(menuItems.map((item) => [item.id, item.name]))} materials={materials} onCreateOrder={handleCreateOrder} onSubmitOrder={handleSubmitOrder} onCancelOrder={handleCancelOrder} onBatchCancelOrder={handleBatchCancelOrder} onViewOrder={handleViewOrder} onAddModifier={async (data) => { try { await invoke("add_order_item_modifier", { req: data }); toast.success("加料已添加"); } catch (e) { toast.error("添加加料失败", { description: String(e) }); } }} onDeleteModifier={async (modifier_id) => { try { await invoke("delete_order_item_modifier", { modifierId: modifier_id }); toast.success("加料已删除"); } catch (e) { toast.error("删除加料失败", { description: String(e) }); } }} onLoadModifiers={async (order_item_id) => { return await invoke<OrderItemModifier[]>("get_order_item_modifiers", { orderItemId: order_item_id }); }} onLoadMore={handleLoadMoreOrders} hasMore={ordersHasMore} searchQuery={searchQuery} />} />
                <Route path="/kds" element={<KDSPage allTickets={kdsTickets} stations={stations} menuItemNames={Object.fromEntries(menuItems.map((m) => [m.id, m.name]))} onStartTicket={async (id) => { try { await invoke("start_ticket", { ticketId: id, operator: null }); toast.success("工单已开始"); loadData(); } catch (e) { toast.error("开始工单失败", { description: String(e) }); } }} onFinishTicket={async (id) => { const ticket = kdsTickets.find((t) => t.id === id); if (ticket) { await handleFinishTicket(ticket); } else { await invoke("finish_ticket", { ticketId: id, operator: null }); toast.success("工单已完成"); loadData(); } }} onRefresh={handleLoadKDS} />} />
                <Route path="/attributes" element={<AttributesPage attributeTemplates={attributeTemplates} />} />
                <Route path="/settings" element={<SettingsPage connected={connected} />} />
                <Route path="/material-states" element={<MaterialStatesPage materialStates={materialStates} materials={materials} units={units} onCreateState={handleCreateMaterialState} onUpdateState={handleUpdateMaterialState} onDeleteState={handleDeleteMaterialState} searchQuery={searchQuery} />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage orders={purchaseOrders} materials={materials} units={units} suppliers={suppliers} onCreateOrder={handleCreatePurchaseOrder} onAddItem={handleAddPurchaseOrderItem} onViewOrder={handleViewPurchaseOrder} onDeleteOrder={handleDeletePurchaseOrder} onReceiveOrder={handleReceivePurchaseOrder} selectedOrder={selectedPurchaseOrder} searchQuery={searchQuery} />} />
                <Route path="/production-orders" element={<ProductionOrdersPage orders={productionOrders} recipes={recipes} onCreateOrder={handleCreateProductionOrder} onStartOrder={handleStartProductionOrder} onCompleteOrder={handleCompleteProductionOrder} onViewOrder={handleViewProductionOrder} onDeleteOrder={handleDeleteProductionOrder} selectedOrder={selectedProductionOrder} searchQuery={searchQuery} />} />
                <Route path="/stocktakes" element={<StocktakesPage stocktakes={stocktakes} onCreateStocktake={handleCreateStocktake} onUpdateItem={handleUpdateStocktakeItem} onCompleteStocktake={handleCompleteStocktake} onViewStocktake={handleViewStocktake} onDeleteStocktake={handleDeleteStocktake} selectedStocktake={selectedStocktake} searchQuery={searchQuery} />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/print-templates" element={<PrintTemplatesPage />} />
                <Route path="/print-settings" element={<PrintSettingsPage />} />
                <Route path="/print-preview" element={<PrintPreviewPage />} />
                <Route path="*" element={<DashboardPage materialsCount={materials.length} recipesCount={recipes.length} ordersCount={orders.length} batchesCount={inventoryBatches.length} orders={orders} inventorySummary={inventorySummary} loading={loading} />} />
              </Routes>
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
    </ErrorBoundary>
  );
}

export default App;
