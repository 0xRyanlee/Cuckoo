import { createContext, useContext } from "react";
import type {
  Unit, MaterialCategory, TagItem, Material, Recipe, RecipeWithItems,
  RecipeCostResult, RecipeType, MenuItem, MenuCategory, Order, OrderWithItems, KitchenStation,
  TicketWithItems, InventoryBatch, InventorySummary, InventoryTxn, AttributeTemplate,
  Supplier, MaterialState, PurchaseOrder, PurchaseOrderWithItems,
  ProductionOrder, ProductionOrderWithItems, Stocktake, StocktakeWithItems
} from "../types";

interface AppContextType {
  loading: boolean;
  connected: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  units: Unit[];
  categories: MaterialCategory[];
  tags: TagItem[];
  materials: Material[];
  recipes: Recipe[];
  recipeTypes: RecipeType[];
  selectedRecipe: RecipeWithItems | null;
  recipeCost: RecipeCostResult | null;
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  ordersHasMore: boolean;
  selectedOrder: OrderWithItems | null;
  stations: KitchenStation[];
  kdsTickets: TicketWithItems[];
  inventoryBatches: InventoryBatch[];
  inventorySummary: InventorySummary[];
  inventoryTxns: InventoryTxn[];
  attributeTemplates: AttributeTemplate[];
  suppliers: Supplier[];
  materialStates: MaterialState[];
  purchaseOrders: PurchaseOrder[];
  selectedPurchaseOrder: PurchaseOrderWithItems | null;
  productionOrders: ProductionOrder[];
  selectedProductionOrder: ProductionOrderWithItems | null;
  stocktakes: Stocktake[];
  selectedStocktake: StocktakeWithItems | null;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export function useMaterials() {
  const { materials, categories, tags, units } = useAppContext();
  return { materials, categories, tags, units };
}

export function useRecipes() {
  const { recipes, recipeTypes, selectedRecipe, recipeCost } = useAppContext();
  return { recipes, recipeTypes, selectedRecipe, recipeCost };
}

export function useMenu() {
  const { menuCategories, menuItems } = useAppContext();
  return { menuCategories, menuItems };
}

export function useOrders() {
  const { orders, ordersHasMore, selectedOrder } = useAppContext();
  return { orders, ordersHasMore, selectedOrder };
}

export function useKDS() {
  const { kdsTickets, stations } = useAppContext();
  return { kdsTickets, stations };
}

export function useInventory() {
  const { inventoryBatches, inventorySummary, inventoryTxns } = useAppContext();
  return { inventoryBatches, inventorySummary, inventoryTxns };
}

export function usePurchaseOrders() {
  const { purchaseOrders, selectedPurchaseOrder } = useAppContext();
  return { purchaseOrders, selectedPurchaseOrder };
}

export function useProductionOrders() {
  const { productionOrders, selectedProductionOrder } = useAppContext();
  return { productionOrders, selectedProductionOrder };
}

export function useStocktakes() {
  const { stocktakes, selectedStocktake } = useAppContext();
  return { stocktakes, selectedStocktake };
}

export function useSuppliers() {
  const { suppliers } = useAppContext();
  return { suppliers };
}
