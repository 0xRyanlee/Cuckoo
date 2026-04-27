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
import { OrdersPage } from "@/pages/orders-page";
import { PrintPage } from "@/pages/print-page";
import { PrintSettingsPage } from "@/pages/print-settings-page";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { toast } from "sonner";
import { useAppData } from "@/hooks/useAppData";
import { useAppActions } from "@/hooks/useAppActions";
import type { OrderItemModifier } from "./types";

// ==================== App ====================

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.slice(1) || "dashboard";
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const {
    loading, connected,
    units,
    categories,
    tags,
    materials,
    recipes, selectedRecipe, setSelectedRecipe,
    recipeCost, setRecipeCost,
    menuCategories,
    menuItems,
    orders, ordersHasMore, setOrders, setOrdersHasMore,
    selectedOrder, setSelectedOrder,
    stations,
    kdsTickets, setKdsTickets,
    inventoryBatches,
    inventorySummary,
    inventoryTxns,
    attributeTemplates,
    suppliers,
    materialStates,
    purchaseOrders, selectedPurchaseOrder, setSelectedPurchaseOrder,
    productionOrders, selectedProductionOrder, setSelectedProductionOrder,
    stocktakes, selectedStocktake, setSelectedStocktake,
    loadData,
  } = useAppData();

  const actions = useAppActions({
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
  });

  useEffect(() => { loadData(); }, []);

  const {
    handleCreateMaterial,
    handleUpdateMaterial,
    handleDeleteMaterial,
    handleRemoveMaterialTag,
    handleCreateCategory,
    handleDeleteCategory,
    handleCreateTag,
    handleDeleteTag,
    handleCreateRecipe,
    handleViewRecipe,
    handleDeleteRecipe,
    handleUpdateRecipe,
    handleAddRecipeItem,
    handleDeleteRecipeItem,
    handleRecalculateCost,
    handleCreateMenuCategory,
    handleUpdateMenuCategory,
    handleDeleteMenuCategory,
    handleToggleMenuItem,
    handleBatchToggleMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleCreateOrder,
    handlePOSOrder,
    handlePOSAndSubmit,
    handleSubmitOrder,
    handleCancelOrder,
    handleBatchCancelOrder,
    handleViewOrder,
    handleLoadMoreOrders,
    handleGetSpecs,
    handleCreateSpec,
    handleUpdateSpec,
    handleDeleteSpec,
    handleCreateSupplier,
    handleUpdateSupplier,
    handleDeleteSupplier,
    handleCreateMaterialState,
    handleUpdateMaterialState,
    handleDeleteMaterialState,
    handleCreatePurchaseOrder,
    handleAddPurchaseOrderItem,
    handleViewPurchaseOrder,
    handleDeletePurchaseOrder,
    handleReceivePurchaseOrder,
    handleCreateProductionOrder,
    handleStartProductionOrder,
    handleCompleteProductionOrder,
    handleViewProductionOrder,
    handleDeleteProductionOrder,
    handleCreateStocktake,
    handleUpdateStocktakeItem,
    handleCompleteStocktake,
    handleViewStocktake,
    handleDeleteStocktake,
    handleCreateBatch,
    handleAdjustInventory,
    handleRecordWastage,
    handleDeleteBatch,
    handleLoadKDS,
    handleFinishTicket,
  } = actions;

  const handleCreateMenuItemFull = actions.handleCreateMenuItem;

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
                <Route path="/print" element={<PrintPage />} />
                <Route path="/print-settings" element={<PrintSettingsPage />} />
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
