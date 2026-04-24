import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart, Send, X, MessageSquare, Tag, FileText } from "lucide-react";

interface MenuCategory {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  sales_price: number;
  is_available: boolean;
  recipe_id: number | null;
  category_id: number | null;
}

interface MenuItemSpec {
  id: number;
  menu_item_id: number;
  spec_code: string;
  spec_name: string;
  price_delta: number;
  qty_multiplier: number;
}

interface CartItem {
  menu_item: MenuItem;
  spec: MenuItemSpec | null;
  qty: number;
  note: string;
}

interface POSPageProps {
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  onCreateOrder: (items: CartItem[]) => Promise<boolean>;
  onCreateAndSubmit: (items: CartItem[]) => Promise<boolean>;
  onGetSpecs: (menuItemId: number) => Promise<MenuItemSpec[]>;
  searchQuery?: string;
  loading?: boolean;
}

export function POSPage({
  menuCategories,
  menuItems,
  onCreateOrder,
  onCreateAndSubmit,
  onGetSpecs,
  searchQuery,
  loading = false,
}: POSPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [currentCartItemIndex, setCurrentCartItemIndex] = useState<number | null>(null);
  const [specs, setSpecs] = useState<MenuItemSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<MenuItemSpec | null>(null);
  const [tempNote, setTempNote] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.menu_item.sales_price + (item.spec?.price_delta || 0)) * item.qty,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  function addToCart(item: MenuItem, spec: MenuItemSpec | null = null, qty: number = 1) {
    const existingIndex = cart.findIndex(
      (c) => c.menu_item.id === item.id && c.spec?.id === spec?.id
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].qty += qty;
      setCart(newCart);
    } else {
      setCart([...cart, { menu_item: item, spec, qty, note: "" }]);
    }
  }

  function updateQty(index: number, delta: number) {
    const newCart = [...cart];
    newCart[index].qty += delta;
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index));
  }

  async function openSpecDialog(item: MenuItem) {
    setCurrentItem(item);
    setSelectedSpec(null);
    try {
      const itemSpecs = await onGetSpecs(item.id);
      setSpecs(itemSpecs);
      if (itemSpecs.length > 0) {
        setSpecDialogOpen(true);
      } else {
        addToCart(item);
      }
    } catch {
      addToCart(item);
    }
  }

  function confirmSpec() {
    if (currentItem) {
      addToCart(currentItem, selectedSpec);
    }
    setSpecDialogOpen(false);
  }

  function openNoteDialog(index: number) {
    setCurrentCartItemIndex(index);
    setTempNote(cart[index].note);
    setNoteDialogOpen(true);
  }

  function confirmNote() {
    if (currentCartItemIndex !== null) {
      const newCart = [...cart];
      newCart[currentCartItemIndex].note = tempNote;
      setCart(newCart);
    }
    setNoteDialogOpen(false);
  }

  function getItemPrice(item: CartItem) {
    return item.menu_item.sales_price + (item.spec?.price_delta || 0);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="flex flex-1 flex-col gap-4">
        <Card className="flex-shrink-0">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg">菜单分类</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </Button>
              {menuCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-lg">
              商品列表
              <Badge variant="secondary" className="ml-2">
                {filteredItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[calc(100%-3rem)]">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-6 w-16 mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredItems.map((item, i) => (
                      <button
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className="group relative flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none animate-stagger"
                        style={{ animationDelay: `${i * 30}ms` }}
                        onClick={() => item.is_available && openSpecDialog(item)}
                        disabled={!item.is_available}
                      >
                        <div className="flex w-full items-start justify-between">
                          <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                          {!item.is_available && (
                            <Badge variant="destructive" className="text-xs">停售</Badge>
                          )}
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ¥{item.sales_price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {filteredItems.length === 0 && (
                    <EmptyState icon={FileText} title="暂无商品" description="搜索或选择分类查找商品" />
                  )}
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="w-96 flex flex-col">
        <CardHeader className="py-3 px-4 flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            当前订单
            {cartCount > 0 && (
              <Badge variant="default" className="ml-auto">
                {cartCount} 件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1 px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <span className="text-sm">请选择商品</span>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.menu_item.name}</div>
                      {item.spec && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{item.spec.spec_name}</span>
                        </div>
                      )}
                      {item.note && (
                        <div className="flex items-center gap-1 mt-1">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{item.note}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeFromCart(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQty(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQty(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        ¥{(getItemPrice(item) * item.qty).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => openNoteDialog(index)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-4 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">合计</span>
            <span className="text-2xl font-bold text-primary">¥{cartTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={async () => { const ok = await onCreateOrder(cart); if (ok) setCart([]); }} disabled={cart.length === 0}>
              暂存
            </Button>
            <Button className="h-12 text-base" size="lg" onClick={async () => { const ok = await onCreateAndSubmit(cart); if (ok) setCart([]); }} disabled={cart.length === 0}>
              <Send className="mr-2 h-5 w-5" />
              提交
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择规格 - {currentItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {specs.map((spec) => (
              <Button
                key={spec.id}
                variant={selectedSpec?.id === spec.id ? "default" : "outline"}
                className="w-full flex items-center justify-between h-auto py-3 px-4"
                onClick={() => setSelectedSpec(spec)}
              >
                <span className="font-medium">{spec.spec_name}</span>
                <div className="flex items-center gap-3">
                  {spec.price_delta !== 0 && (
                    <span className={`text-sm ${spec.price_delta > 0 ? "text-destructive" : "text-emerald-500"}`}>
                      {spec.price_delta > 0 ? "+" : ""}¥{spec.price_delta.toFixed(2)}
                    </span>
                  )}
                  {spec.qty_multiplier !== 1 && (
                    <span className="text-xs text-muted-foreground">x{spec.qty_multiplier}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmSpec} disabled={!selectedSpec}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加备注</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="note">备注内容</Label>
            <Textarea
              id="note"
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="如：少辣、不要葱、加份米饭..."
              className="mt-2"
              rows={3}
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              {["少辣", "多辣", "不要葱", "不要蒜", "加急", "打包"].map((note) => (
                <Button
                  key={note}
                  variant="outline"
                  size="sm"
                  onClick={() => setTempNote(tempNote ? `${tempNote} ${note}` : note)}
                >
                  {note}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmNote}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
