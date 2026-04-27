import { invoke } from "@tauri-apps/api/core";
import type {
  MaterialCategory, RecipeCostResult, MenuItem, MenuCategory, POSCartItem, MenuItemSpec,
  TicketWithItems, Order, OrderWithItems, OrderItemModifier, Recipe, RecipeWithItems,
  PurchaseOrderWithItems, ProductionOrderWithItems, StocktakeWithItems, Material, Supplier, Unit, InventoryBatch
} from "../types";
import { toast } from "sonner";

export interface UseAppActionsParams {
  loadData: () => Promise<void>;
  categories: MaterialCategory[];
  menuCategories: MenuCategory[];
  orders: Order[];
  materials: Material[];
  suppliers: Supplier[];
  units: Unit[];
  inventoryBatches: InventoryBatch[];
  menuItems: MenuItem[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setOrdersHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRecipe: React.Dispatch<React.SetStateAction<RecipeWithItems | null>>;
  setRecipeCost: React.Dispatch<React.SetStateAction<RecipeCostResult | null>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<OrderWithItems | null>>;
  setKdsTickets: React.Dispatch<React.SetStateAction<TicketWithItems[]>>;
  setSelectedPurchaseOrder: React.Dispatch<React.SetStateAction<PurchaseOrderWithItems | null>>;
  setSelectedProductionOrder: React.Dispatch<React.SetStateAction<ProductionOrderWithItems | null>>;
  setSelectedStocktake: React.Dispatch<React.SetStateAction<StocktakeWithItems | null>>;
}

export function useAppActions({
  loadData,
  categories,
  menuCategories,
  orders,
  materials,
  suppliers,
  units,
  inventoryBatches,
  menuItems,
  setOrders,
  setOrdersHasMore,
  setSelectedRecipe,
  setRecipeCost,
  setSelectedOrder,
  setKdsTickets,
  setSelectedPurchaseOrder,
  setSelectedProductionOrder,
  setSelectedStocktake,
}: UseAppActionsParams) {
  // 材料相關
  const handleCreateMaterial = async (data: { code: string; name: string; base_unit_id: number; category_id: number | null; tag_ids: number[] }) => {
    try { await invoke("create_material", { req: { code: data.code, name: data.name, base_unit_id: data.base_unit_id, category_id: data.category_id, shelf_life_days: null, tag_ids: data.tag_ids } }); toast.success("材料已创建", { description: data.name }); loadData(); }
    catch (e) { toast.error("创建材料失败", { description: String(e) }); }
  };

  const handleUpdateMaterial = async (id: number, data: { name?: string; category_id?: number | null; min_qty?: number }) => {
    try { await invoke("update_material", { id, name: data.name || null, categoryId: data.category_id, shelfLifeDays: null, minQty: data.min_qty ?? null }); toast.success("材料已更新"); loadData(); }
    catch (e) { toast.error("更新材料失败", { description: String(e) }); }
  };

  const handleDeleteMaterial = async (id: number) => {
    try { await invoke("delete_material", { id }); toast.success("材料已删除"); loadData(); } catch (e) { toast.error("删除材料失败", { description: String(e) }); }
  };

  const handleRemoveMaterialTag = async (material_id: number, tag_id: number) => {
    try { await invoke("remove_material_tag", { materialId: material_id, tagId: tag_id }); loadData(); } catch (e) { toast.error("移除标签失败", { description: String(e) }); }
  };

  // 分類與標籤
  const handleCreateCategory = async (data: { code: string; name: string }) => {
    try { await invoke("create_material_category", { req: { ...data, sort_no: categories.length + 1 } }); toast.success("分类已创建", { description: data.name }); loadData(); } catch (e) { toast.error("创建分类失败", { description: String(e) }); }
  };

  const handleDeleteCategory = async (id: number) => {
    try { await invoke("delete_material_category", { id }); toast.success("分类已删除"); loadData(); } catch (e) { toast.error("删除分类失败", { description: String(e) }); }
  };

  const handleCreateTag = async (data: { code: string; name: string; color?: string }) => {
    try { await invoke("create_tag", { req: { ...data, color: data.color || null } }); toast.success("标签已创建", { description: data.name }); loadData(); } catch (e) { toast.error("创建标签失败", { description: String(e) }); }
  };

  const handleDeleteTag = async (id: number) => {
    try { await invoke("delete_tag", { id }); toast.success("标签已删除"); loadData(); } catch (e) { toast.error("删除标签失败", { description: String(e) }); }
  };

  // 配方
  const handleCreateRecipe = async (data: { code: string; name: string }) => {
    try { await invoke("create_recipe", { req: { ...data, recipe_type: "menu", output_qty: 1.0, output_material_id: null, output_state_id: null, output_unit_id: null, items: null } }); toast.success("配方已创建", { description: data.name }); loadData(); } catch (e) { toast.error("创建配方失败", { description: String(e) }); }
  };

  const handleViewRecipe = async (recipe: Recipe) => {
    try {
      const data = await invoke<RecipeWithItems>("get_recipe_with_items", { recipeId: recipe.id });
      setSelectedRecipe(data);
      const cost = await invoke<RecipeCostResult>("calculate_recipe_cost", { recipeId: recipe.id });
      setRecipeCost(cost);
    } catch (e) { toast.error("加载配方失败", { description: String(e) }); }
  };

  const handleDeleteRecipe = async (id: number) => {
    try { await invoke("delete_recipe", { id }); toast.success("配方已删除"); setSelectedRecipe(null); setRecipeCost(null); loadData(); } catch (e) { toast.error("删除配方失败", { description: String(e) }); }
  };

  const handleUpdateRecipe = async (id: number, name: string, output_qty: number) => {
    try { await invoke("update_recipe", { id, name, outputQty: output_qty }); toast.success("配方已更新"); loadData(); } catch (e) { toast.error("更新配方失败", { description: String(e) }); }
  };

  const handleAddRecipeItem = async (recipe_id: number, item_type: string, ref_id: number, qty: number, unit_id: number, wastage_rate: number) => {
    try { await invoke("add_recipe_item", { recipeId: recipe_id, req: { item_type, ref_id, qty, unit_id, wastage_rate } }); toast.success("配方项已添加"); } catch (e) { toast.error("添加配方项失败", { description: String(e) }); }
  };

  const handleDeleteRecipeItem = async (item_id: number) => {
    try { await invoke("delete_recipe_item", { itemId: item_id }); toast.success("配方项已删除"); } catch (e) { toast.error("删除配方项失败", { description: String(e) }); }
  };

  const handleUpdateRecipeItem = async (item_id: number, qty: number, wastage_rate: number) => {
    try { await invoke("update_recipe_item", { itemId: item_id, qty, wastageRate: wastage_rate }); toast.success("配方项已更新"); } catch (e) { toast.error("更新配方项失败", { description: String(e) }); }
  };

  const handleRecalculateCost = async (id: number) => {
    try { const cost = await invoke<RecipeCostResult>("calculate_recipe_cost", { recipeId: id }); setRecipeCost(cost); } catch (e) { toast.error("计算成本失败", { description: String(e) }); }
  };

  // 菜單
  const handleCreateMenuCategory = async (name: string) => {
    try { await invoke("create_menu_category", { name, sortNo: menuCategories.length + 1 }); toast.success("菜单分类已创建", { description: name }); loadData(); } catch (e) { toast.error("创建菜单分类失败", { description: String(e) }); }
  };

  const handleCreateMenuItem = async (data: { name: string; price: number; category_id: number | null; recipe_id: number | null }) => {
    try { await invoke("create_menu_item", { req: { name: data.name, category_id: data.category_id, recipe_id: data.recipe_id, sales_price: data.price } }); toast.success("菜品已添加", { description: data.name }); loadData(); } catch (e) { toast.error("添加菜品失败", { description: String(e) }); }
  };

  const handleToggleMenuItem = async (id: number, is_available: boolean) => {
    try { await invoke("toggle_menu_item_availability", { id, isAvailable: is_available }); loadData(); } catch (e) { toast.error("切换菜品状态失败", { description: String(e) }); }
  };

  const handleBatchToggleMenuItem = async (ids: number[], is_available: boolean) => {
    try { const count = await invoke<number>("batch_toggle_menu_item_availability", { ids, isAvailable: is_available }); toast.success(`已批量切换 ${count} 个菜品`); loadData(); } catch (e) { toast.error("批量切换失败", { description: String(e) }); }
  };

  const handleUpdateMenuItem = async (id: number, data: { name?: string; category_id?: number | null; recipe_id?: number | null; sales_price?: number }) => {
    try { await invoke("update_menu_item", { id, name: data.name || null, categoryId: data.category_id, recipeId: data.recipe_id, salesPrice: data.sales_price }); toast.success("菜品已更新"); loadData(); } catch (e) { toast.error("更新菜品失败", { description: String(e) }); }
  };

  const handleDeleteMenuItem = async (id: number) => {
    try { await invoke("delete_menu_item", { id }); toast.success("菜品已删除"); loadData(); } catch (e) { toast.error("删除菜品失败", { description: String(e) }); }
  };

  const handleUpdateMenuCategory = async (id: number, name: string) => {
    try { await invoke("update_menu_category", { id, name, sortNo: 0 }); toast.success("分类已更新"); loadData(); } catch (e) { toast.error("更新分类失败", { description: String(e) }); }
  };

  const handleDeleteMenuCategory = async (id: number) => {
    try { await invoke("delete_menu_category", { id }); toast.success("分类已删除"); loadData(); } catch (e) { toast.error("删除分类失败", { description: String(e) }); }
  };

  // 訂單
  const handleCreateOrder = async (dineType: string = "dine_in", tableNo: string | null = null) => {
    try { await invoke("create_order", { req: { source: "pos", dine_type: dineType, table_no: tableNo } }); toast.success("订单已创建"); loadData(); } catch (e) { toast.error("创建订单失败", { description: String(e) }); }
  };

  const handlePOSAndSubmit = async (cart: POSCartItem[], dineType: string = "dine_in", tableNo: string | null = null) => {
    try {
      const { id: orderId } = await invoke<{ id: number; order_no: string }>("create_order", { req: { source: "pos", dine_type: dineType, table_no: tableNo } });
      for (const item of cart) {
        const orderItemId = await invoke<number>("add_order_item", {
          req: { order_id: orderId, menu_item_id: item.menu_item.id, qty: item.qty, unit_price: item.menu_item.sales_price + (item.spec?.price_delta || 0), spec_code: item.spec?.spec_code || null, note: item.note || null },
        });
        if (item.modifiers?.length) {
          for (const mod of item.modifiers) {
            await invoke("add_order_item_modifier", { req: { order_item_id: orderItemId, modifier_type: mod.modifier_type, material_id: mod.material_id || null, qty: mod.qty, price_delta: mod.price_delta } });
          }
        }
      }
      await invoke("submit_order", { orderId });
      toast.success("订单已提交");
      loadData();
      return true;
    } catch (e) { toast.error("提交订单失败", { description: String(e) }); return false; }
  };

  const handlePOSOrder = async (cart: POSCartItem[], dineType: string = "dine_in", tableNo: string | null = null) => {
    try {
      const { id: orderId } = await invoke<{ id: number; order_no: string }>("create_order", { req: { source: "pos", dine_type: dineType, table_no: tableNo } });
      for (const item of cart) {
        await invoke("add_order_item", {
          req: { order_id: orderId, menu_item_id: item.menu_item.id, qty: item.qty, unit_price: item.menu_item.sales_price + (item.spec?.price_delta || 0), spec_code: item.spec?.spec_code || null, note: item.note || null },
        });
      }
      toast.success("订单已创建");
      loadData();
      return true;
    } catch (e) { toast.error("创建订单失败", { description: String(e) }); return false; }
  };

  const handleSubmitOrder = async (orderId: number) => {
    try { await invoke("submit_order", { orderId }); toast.success("订单已提交"); loadData(); } catch (e) { toast.error("提交订单失败", { description: String(e) }); }
  };

  const handleCancelOrder = async (orderId: number) => {
    try { await invoke("cancel_order", { orderId }); toast.success("订单已取消"); loadData(); } catch (e) { toast.error("取消订单失败", { description: String(e) }); }
  };

  const handleViewOrder = async (orderId: number) => {
    try { const data = await invoke<OrderWithItems>("get_order_with_items", { orderId }); setSelectedOrder(data); } catch (e) { toast.error("加载订单失败", { description: String(e) }); }
  };

  const handleLoadMoreOrders = async () => {
    try {
      const more = await invoke<Order[]>("get_orders", { limit: 200, offset: orders.length });
      setOrders((prev) => [...prev, ...more]);
      setOrdersHasMore(more.length === 200);
    } catch (e) { toast.error("加载订单失败", { description: String(e) }); }
  };

  const handleBatchCancelOrder = async (ids: number[]) => {
    try { const count = await invoke<number>("batch_cancel_orders", { ids }); toast.success(`已取消 ${count} 个订单`); loadData(); } catch (e) { toast.error("批量取消失败", { description: String(e) }); }
  };

  // 規格
  const handleGetSpecs = async (menuItemId: number): Promise<MenuItemSpec[]> => {
    return await invoke<MenuItemSpec[]>("get_menu_item_specs", { menuItemId });
  };

  const handleCreateSpec = async (data: { menu_item_id: number; spec_code: string; spec_name: string; price_delta: number; qty_multiplier: number }) => {
    try { await invoke("create_menu_item_spec", { req: data }); toast.success("规格已创建"); } catch (e) { toast.error("创建规格失败", { description: String(e) }); }
  };

  const handleUpdateSpec = async (id: number, data: { spec_code?: string; spec_name?: string; price_delta?: number; qty_multiplier?: number }) => {
    try { await invoke("update_menu_item_spec", { id, specCode: data.spec_code || null, specName: data.spec_name || null, priceDelta: data.price_delta, qtyMultiplier: data.qty_multiplier }); toast.success("规格已更新"); } catch (e) { toast.error("更新规格失败", { description: String(e) }); }
  };

  const handleDeleteSpec = async (id: number) => {
    try { await invoke("delete_menu_item_spec", { id }); toast.success("规格已删除"); } catch (e) { toast.error("删除规格失败", { description: String(e) }); }
  };

  // 供應商
  const handleCreateSupplier = async (data: { name: string; phone?: string; contact_person?: string }) => {
    try { await invoke("create_supplier", { req: { name: data.name, phone: data.phone || null, contact_person: data.contact_person || null } }); toast.success("供应商已创建", { description: data.name }); loadData(); } catch (e) { toast.error("创建供应商失败", { description: String(e) }); }
  };

  const handleUpdateSupplier = async (id: number, data: { name?: string; phone?: string | null; contact_person?: string | null; address?: string | null; note?: string | null }) => {
    try { await invoke("update_supplier", { id, name: data.name || null, phone: data.phone, contactPerson: data.contact_person, address: data.address, note: data.note }); toast.success("供应商已更新"); loadData(); } catch (e) { toast.error("更新供应商失败", { description: String(e) }); }
  };

  const handleDeleteSupplier = async (id: number) => {
    try { await invoke("delete_supplier", { id }); toast.success("供应商已删除"); loadData(); } catch (e) { toast.error("删除供应商失败", { description: String(e) }); }
  };

  // 材料狀態
  const handleCreateMaterialState = async (data: { material_id: number; state_code: string; state_name: string; unit_id: number | null; yield_rate: number; cost_multiplier: number }) => {
    try { await invoke("create_material_state", { req: data }); toast.success("材料状态已创建"); loadData(); } catch (e) { toast.error("创建材料状态失败", { description: String(e) }); }
  };

  const handleUpdateMaterialState = async (id: number, data: { state_code?: string; state_name?: string; unit_id?: number | null; yield_rate?: number; cost_multiplier?: number }) => {
    try { await invoke("update_material_state", { id, stateCode: data.state_code || null, stateName: data.state_name || null, unitId: data.unit_id, yieldRate: data.yield_rate, costMultiplier: data.cost_multiplier }); toast.success("材料状态已更新"); loadData(); } catch (e) { toast.error("更新材料状态失败", { description: String(e) }); }
  };

  const handleDeleteMaterialState = async (id: number) => {
    try { await invoke("delete_material_state", { id }); toast.success("材料状态已删除"); loadData(); } catch (e) { toast.error("删除材料状态失败", { description: String(e) }); }
  };

  // 採購單
  const handleCreatePurchaseOrder = async (data: { supplier_id: number | null; expected_date: string | null }) => {
    try { await invoke("create_purchase_order", { supplierId: data.supplier_id, expectedDate: data.expected_date }); toast.success("采购单已创建"); loadData(); } catch (e) { toast.error("创建采购单失败", { description: String(e) }); }
  };

  const handleAddPurchaseOrderItem = async (data: { po_id: number; material_id: number; qty: number; unit_id: number | null; cost_per_unit: number }) => {
    try { await invoke("add_purchase_order_item", { req: data }); toast.success("采购项已添加"); loadData(); } catch (e) { toast.error("添加采购项失败", { description: String(e) }); }
  };

  const handleViewPurchaseOrder = async (po_id: number) => {
    try { setSelectedPurchaseOrder(await invoke<PurchaseOrderWithItems>("get_purchase_order_with_items", { poId: po_id })); } catch (e) { toast.error("加载采购单失败", { description: String(e) }); }
  };

  const handleDeletePurchaseOrder = async (po_id: number) => {
    try { await invoke("delete_purchase_order", { poId: po_id }); toast.success("采购单已删除"); loadData(); setSelectedPurchaseOrder(null); } catch (e) { toast.error("删除采购单失败", { description: String(e) }); }
  };

  const handleReceivePurchaseOrder = async (po_id: number) => {
    try { await invoke("receive_purchase_order", { poId: po_id, operator: null }); toast.success("采购单已入库"); loadData(); } catch (e) { toast.error("入库失败", { description: String(e) }); }
  };

  // 生產單
  const handleCreateProductionOrder = async (data: { recipe_id: number; planned_qty: number; operator: string | null }) => {
    try { await invoke("create_production_order", { recipeId: data.recipe_id, plannedQty: data.planned_qty, operator: data.operator }); toast.success("生产单已创建"); loadData(); } catch (e) { toast.error("创建生产单失败", { description: String(e) }); }
  };

  const handleStartProductionOrder = async (production_id: number) => {
    try { await invoke("start_production_order", { productionId: production_id, operator: null }); toast.success("生产已开始"); loadData(); } catch (e) { toast.error("开始生产失败", { description: String(e) }); }
  };

  const handleCompleteProductionOrder = async (production_id: number, actual_qty: number) => {
    try { await invoke("complete_production_order", { productionId: production_id, actualQty: actual_qty, operator: null }); toast.success("生产已完成"); loadData(); } catch (e) { toast.error("完成生产失败", { description: String(e) }); }
  };

  const handleViewProductionOrder = async (production_id: number) => {
    try { setSelectedProductionOrder(await invoke<ProductionOrderWithItems>("get_production_order_with_items", { productionId: production_id })); } catch (e) { toast.error("加载生产单失败", { description: String(e) }); }
  };

  const handleDeleteProductionOrder = async (production_id: number) => {
    try { await invoke("delete_production_order", { productionId: production_id }); toast.success("生产单已删除"); loadData(); setSelectedProductionOrder(null); } catch (e) { toast.error("删除生产单失败", { description: String(e) }); }
  };

  // 盤點
  const handleCreateStocktake = async (data: { operator: string | null; note: string | null }) => {
    try { await invoke("create_stocktake", { operator: data.operator, note: data.note }); toast.success("盘点已创建"); loadData(); } catch (e) { toast.error("创建盘点失败", { description: String(e) }); }
  };

  const handleUpdateStocktakeItem = async (item_id: number, actual_qty: number) => {
    try { await invoke("update_stocktake_item", { itemId: item_id, actualQty: actual_qty }); loadData(); } catch (e) { toast.error("更新盘点项失败", { description: String(e) }); }
  };

  const handleCompleteStocktake = async (stocktake_id: number) => {
    try { await invoke("complete_stocktake", { stocktakeId: stocktake_id, operator: null }); toast.success("盘点已完成"); loadData(); } catch (e) { toast.error("完成盘点失败", { description: String(e) }); }
  };

  const handleViewStocktake = async (stocktake_id: number) => {
    try { setSelectedStocktake(await invoke<StocktakeWithItems>("get_stocktake_with_items", { stocktakeId: stocktake_id })); } catch (e) { toast.error("加载盘点失败", { description: String(e) }); }
  };

  const handleDeleteStocktake = async (stocktake_id: number) => {
    try { await invoke("delete_stocktake", { stocktakeId: stocktake_id }); toast.success("盘点已删除"); loadData(); setSelectedStocktake(null); } catch (e) { toast.error("删除盘点失败", { description: String(e) }); }
  };

  // 批次
  const handleCreateBatch = async (data: { material_id: number; lot_no: string; quantity: number; cost_per_unit: number; supplier_id: number | null; expiry_date: string | null; production_date: string | null }) => {
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
  };

  const handleAdjustInventory = async (lot_id: number, qty_delta: number, reason: string) => {
    try {
      const batch = inventoryBatches.find((b) => b.id === lot_id);
      if (!batch) return;
      await invoke("adjust_inventory", { req: { material_id: batch.material_id, lot_id, qty_delta, reason, operator: null, note: null } });
      toast.success("库存已调整");
      loadData();
    } catch (e) { toast.error("调整库存失败", { description: String(e) }); }
  };

  const handleRecordWastage = async (lot_id: number, qty: number, wastage_type: string) => {
    try {
      const batch = inventoryBatches.find((b) => b.id === lot_id);
      if (!batch) return;
      await invoke("record_wastage", { req: { material_id: batch.material_id, lot_id, qty, wastage_type, operator: null, note: null } });
      toast.success("废弃已记录");
      loadData();
    } catch (e) { toast.error("记录废弃失败", { description: String(e) }); }
  };

  const handleDeleteBatch = async (batch_id: number) => {
    try { await invoke("delete_inventory_batch", { batchId: batch_id }); toast.success("批次已删除"); loadData(); } catch (e) { toast.error("删除批次失败", { description: String(e) }); }
  };

  // KDS
  const handleLoadKDS = async () => {
    try { const pendingTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "pending" }); const startedTickets = await invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "started" }); setKdsTickets([...pendingTickets, ...startedTickets]); } catch (e) { toast.error("加载KDS失败", { description: String(e) }); }
  };

  const handleFinishTicket = async (ticket: TicketWithItems) => {
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
  };

  // 訂單修改器
  const handleAddModifier = async (data: { order_item_id: number; modifier_type: string; material_id: number | null; qty: number; price_delta: number }) => {
    try { await invoke("add_order_item_modifier", { req: data }); toast.success("加料已添加"); } catch (e) { toast.error("添加加料失败", { description: String(e) }); }
  };

  const handleDeleteModifier = async (modifier_id: number) => {
    try { await invoke("delete_order_item_modifier", { modifierId: modifier_id }); toast.success("加料已删除"); } catch (e) { toast.error("删除加料失败", { description: String(e) }); }
  };

  const handleLoadModifiers = async (order_item_id: number): Promise<OrderItemModifier[]> => {
    return await invoke<OrderItemModifier[]>("get_order_item_modifiers", { orderItemId: order_item_id });
  };

  const handleReportTelemetry = async (payload: { client_id: string; version: string; uptime_hours: number; today_sales: number; today_orders: number }, webhookUrl?: string) => {
    try { await invoke("report_telemetry", { payload, webhookUrl: webhookUrl || null }); } catch (e) { console.error("telemetry failed:", e); }
  };

  return {
    // 材料
    handleCreateMaterial, handleUpdateMaterial, handleDeleteMaterial, handleRemoveMaterialTag,
    // 分類與標籤
    handleCreateCategory, handleDeleteCategory, handleCreateTag, handleDeleteTag,
    // 配方
    handleCreateRecipe, handleViewRecipe, handleDeleteRecipe, handleUpdateRecipe, handleAddRecipeItem, handleDeleteRecipeItem, handleUpdateRecipeItem, handleRecalculateCost,
    // 菜單
    handleCreateMenuCategory, handleUpdateMenuCategory, handleDeleteMenuCategory, handleCreateMenuItem, handleToggleMenuItem, handleBatchToggleMenuItem, handleUpdateMenuItem, handleDeleteMenuItem,
    // 訂單
    handleCreateOrder, handlePOSOrder, handlePOSAndSubmit, handleSubmitOrder, handleCancelOrder, handleBatchCancelOrder, handleViewOrder, handleLoadMoreOrders,
    // 規格
    handleGetSpecs, handleCreateSpec, handleUpdateSpec, handleDeleteSpec,
    // 供應商
    handleCreateSupplier, handleUpdateSupplier, handleDeleteSupplier,
    // 材料狀態
    handleCreateMaterialState, handleUpdateMaterialState, handleDeleteMaterialState,
    // 採購單
    handleCreatePurchaseOrder, handleAddPurchaseOrderItem, handleViewPurchaseOrder, handleDeletePurchaseOrder, handleReceivePurchaseOrder,
    // 生產單
    handleCreateProductionOrder, handleStartProductionOrder, handleCompleteProductionOrder, handleViewProductionOrder, handleDeleteProductionOrder,
    // 盤點
    handleCreateStocktake, handleUpdateStocktakeItem, handleCompleteStocktake, handleViewStocktake, handleDeleteStocktake,
    // 批次
    handleCreateBatch, handleAdjustInventory, handleRecordWastage, handleDeleteBatch,
    // KDS
    handleLoadKDS, handleFinishTicket,
    // 訂單修改器
    handleAddModifier, handleDeleteModifier, handleLoadModifiers,
    // 遙測
    handleReportTelemetry,
  };
}