import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { appLogger } from "@/lib/logger";
import type {
  Unit, MaterialCategory, TagItem, Material, Recipe, RecipeWithItems,
  RecipeCostResult, RecipeType, MenuItem, MenuCategory, Order, OrderWithItems, KitchenStation,
  TicketWithItems, InventoryBatch, InventorySummary, InventoryTxn, AttributeTemplate,
  Supplier, MaterialState, PurchaseOrder, PurchaseOrderWithItems,
  ProductionOrder, ProductionOrderWithItems, Stocktake, StocktakeWithItems, Expense, SupplierProduct
} from "../types";

// Wraps invoke so any failure is logged with the operation name before re-throwing.
// This lets the pipeline immediately identify which specific IPC call caused a black screen.
async function tracked<T>(operation: string, promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    appLogger.logInvokeError(operation, e);
    throw e;
  }
}

export function useAppData() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeTypes, setRecipeTypes] = useState<RecipeType[]>([]);
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tracked("health_check", invoke<string>("health_check"));
      setConnected(result === "ok");
      try { await invoke("check_and_create_alerts"); } catch { /* ignore alert check errors */ }
      setUnits(await tracked("get_units", invoke<Unit[]>("get_units")));
      setCategories(await tracked("get_material_categories", invoke<MaterialCategory[]>("get_material_categories")));
      setTags(await tracked("get_tags", invoke<TagItem[]>("get_tags")));
      setMaterials(await tracked("get_materials", invoke<Material[]>("get_materials")));
      setRecipes(await tracked("get_recipes", invoke<Recipe[]>("get_recipes")));
      setRecipeTypes(await tracked("get_recipe_types", invoke<RecipeType[]>("get_recipe_types")));
      setMenuCategories(await tracked("get_menu_categories", invoke<MenuCategory[]>("get_menu_categories")));
      setMenuItems(await tracked("get_menu_items", invoke<MenuItem[]>("get_menu_items")));
      const fetchedOrders = await tracked("get_orders", invoke<Order[]>("get_orders", { limit: 200, offset: 0 }));
      setOrders(fetchedOrders);
      setOrdersHasMore(fetchedOrders.length === 200);
      setStations(await tracked("get_kitchen_stations", invoke<KitchenStation[]>("get_kitchen_stations")));
      setInventoryBatches(await tracked("get_inventory_batches", invoke<InventoryBatch[]>("get_inventory_batches")));
      setInventorySummary(await tracked("get_inventory_summary", invoke<InventorySummary[]>("get_inventory_summary")));
      setInventoryTxns(await tracked("get_inventory_txns", invoke<InventoryTxn[]>("get_inventory_txns", { limit: 50 })));
      setAttributeTemplates(await tracked("get_attribute_templates", invoke<AttributeTemplate[]>("get_attribute_templates")));
      setSuppliers(await tracked("get_suppliers", invoke<Supplier[]>("get_suppliers")));
      setMaterialStates(await tracked("get_all_material_states", invoke<MaterialState[]>("get_all_material_states")));
      setPurchaseOrders(await tracked("get_purchase_orders", invoke<PurchaseOrder[]>("get_purchase_orders")));
      setProductionOrders(await tracked("get_production_orders", invoke<ProductionOrder[]>("get_production_orders")));
      setStocktakes(await tracked("get_stocktakes", invoke<Stocktake[]>("get_stocktakes")));
      setExpenses(await tracked("get_expenses", invoke<Expense[]>("get_expenses", { expenseType: null, startDate: null, endDate: null })));
      setSupplierProducts(await tracked("get_supplier_products", invoke<SupplierProduct[]>("get_supplier_products", { channel: null })));
      const pendingTickets = await tracked("get_tickets_pending", invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "pending" }));
      const startedTickets = await tracked("get_tickets_started", invoke<TicketWithItems[]>("get_all_tickets_with_items", { status: "started" }));
      setKdsTickets([...pendingTickets, ...startedTickets]);
    } catch (e) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading, setLoading, connected,
    units, setUnits,
    categories, setCategories,
    tags, setTags,
    materials, setMaterials,
    recipes, setRecipes,
    recipeTypes, setRecipeTypes,
    selectedRecipe, setSelectedRecipe,
    recipeCost, setRecipeCost,
    menuCategories, setMenuCategories,
    menuItems, setMenuItems,
    orders, setOrders,
    ordersHasMore, setOrdersHasMore,
    selectedOrder, setSelectedOrder,
    stations, setStations,
    kdsTickets, setKdsTickets,
    inventoryBatches, setInventoryBatches,
    inventorySummary, setInventorySummary,
    inventoryTxns, setInventoryTxns,
    attributeTemplates, setAttributeTemplates,
    suppliers, setSuppliers,
    materialStates, setMaterialStates,
    purchaseOrders, setPurchaseOrders,
    selectedPurchaseOrder, setSelectedPurchaseOrder,
    productionOrders, setProductionOrders,
    selectedProductionOrder, setSelectedProductionOrder,
    stocktakes, setStocktakes,
    selectedStocktake, setSelectedStocktake,
    expenses, setExpenses,
    supplierProducts, setSupplierProducts,
    loadData,
  };
}
