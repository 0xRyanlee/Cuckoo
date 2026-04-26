import { invoke } from "@tauri-apps/api/core";
import type {
  MaterialCategory, RecipeCostResult
} from "../types";
import { toast } from "sonner";

export function useAppActions(
  loadData: () => Promise<void>,
  categories: MaterialCategory[]
) {
  const handleCreateMaterial = async (data: { code: string; name: string; base_unit_id: number; category_id: number | null; tag_ids: number[] }) => {
    try { await invoke("create_material", { req: { code: data.code, name: data.name, base_unit_id: data.base_unit_id, category_id: data.category_id, shelf_life_days: null, tag_ids: data.tag_ids } }); toast.success("材料已创建", { description: data.name }); loadData(); }
    catch (e) { toast.error("创建材料失败", { description: String(e) }); }
  };

  const handleUpdateMaterial = async (id: number, data: { name?: string; category_id?: number | null }) => {
    try { await invoke("update_material", { id, name: data.name || null, categoryId: data.category_id, shelfLifeDays: null }); toast.success("材料已更新"); loadData(); }
    catch (e) { toast.error("更新材料失败", { description: String(e) }); }
  };

  const handleDeleteMaterial = async (id: number) => {
    try { await invoke("delete_material", { id }); toast.success("材料已删除"); loadData(); } catch (e) { toast.error("删除材料失败", { description: String(e) }); }
  };

  const handleRemoveMaterialTag = async (material_id: number, tag_id: number) => {
    try { await invoke("remove_material_tag", { materialId: material_id, tagId: tag_id }); loadData(); } catch (e) { toast.error("移除标签失败", { description: String(e) }); }
  };

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

  const handleCreateRecipe = async (data: { code: string; name: string }) => {
    try { await invoke("create_recipe", { req: { ...data, recipe_type: "menu", output_qty: 1.0, output_material_id: null, output_state_id: null, output_unit_id: null, items: null } }); toast.success("配方已创建", { description: data.name }); loadData(); } catch (e) { toast.error("创建配方失败", { description: String(e) }); }
  };

  const handleDeleteRecipe = async (id: number) => {
    try { await invoke("delete_recipe", { id }); toast.success("配方已删除"); loadData(); } catch (e) { toast.error("删除配方失败", { description: String(e) }); }
  };

  const handleUpdateRecipe = async (id: number, data: { name?: string }) => {
    try { await invoke("update_recipe", { id, name: data.name || null }); toast.success("配方已更新"); loadData(); } catch (e) { toast.error("更新配方失败", { description: String(e) }); }
  };

  const handleAddRecipeItem = async (data: { recipe_id: number; item_type: string; ref_id: number; qty: number; unit_id: number; wastage_rate?: number }) => {
    try { await invoke("add_recipe_item", { req: data }); toast.success("配方项已添加"); loadData(); } catch (e) { toast.error("添加配方项失败", { description: String(e) }); }
  };

  const handleDeleteRecipeItem = async (id: number) => {
    try { await invoke("delete_recipe_item", { id }); toast.success("配方项已删除"); loadData(); } catch (e) { toast.error("删除配方项失败", { description: String(e) }); }
  };

  const handleRecalculateCost = async (id: number) => {
    try { await invoke<RecipeCostResult>("calculate_recipe_cost", { recipeId: id }); } catch (e) { toast.error("计算成本失败", { description: String(e) }); }
  };

  return {
    handleCreateMaterial, handleUpdateMaterial, handleDeleteMaterial, handleRemoveMaterialTag,
    handleCreateCategory, handleDeleteCategory, handleCreateTag, handleDeleteTag,
    handleCreateRecipe, handleDeleteRecipe, handleUpdateRecipe,
    handleAddRecipeItem, handleDeleteRecipeItem, handleRecalculateCost,
  };
}