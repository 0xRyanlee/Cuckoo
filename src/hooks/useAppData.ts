import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  Unit, MaterialCategory, TagItem, Material, Recipe, RecipeWithItems,
  RecipeCostResult, MenuItem, MenuCategory, Order, OrderWithItems, KitchenStation,
  TicketWithItems, InventoryBatch, InventorySummary, InventoryTxn, AttributeTemplate,
  Supplier, MaterialState, PurchaseOrder, PurchaseOrderWithItems,
  ProductionOrder, ProductionOrderWithItems, Stocktake, StocktakeWithItems
} from "../types";

export function useAppData() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

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

  const loadData = useCallback(async () => {
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
    loadData,
  };
}