import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Play, Check, Clock, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface OrderItem {
  id: number;
  menu_item_id: number;
  spec_code: string | null;
  qty: number;
  unit_price: number;
  note: string | null;
}

interface TicketWithItems {
  id: number;
  order_id: number;
  station_id: number;
  status: string;
  priority: number;
  printed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  order_no: string;
  dine_type: string;
  table_no: string | null;
  items: OrderItem[];
}

interface KDSPageProps {
  allTickets: TicketWithItems[];
  onStartTicket: (ticketId: number) => void;
  onFinishTicket: (ticketId: number) => void;
  onRefresh: () => void;
}

export function KDSPage({
  allTickets,
  onStartTicket,
  onFinishTicket,
  onRefresh,
}: KDSPageProps) {
  const [menuItems, setMenuItems] = useState<Record<number, string>>({});

  useEffect(() => {
    invoke<any[]>("get_menu_items").then((items) => {
      const map: Record<number, string> = {};
      items.forEach((item) => { map[item.id] = item.name; });
      setMenuItems(map);
    }).catch(() => {});
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "border-amber-500/50 bg-amber-500/5";
      case "started": return "border-blue-500/50 bg-blue-500/5";
      case "finished": return "border-emerald-500/50 bg-emerald-500/5";
      default: return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-amber-500 text-amber-500">待制作</Badge>;
      case "started": return <Badge className="bg-blue-600">制作中</Badge>;
      case "finished": return <Badge className="bg-emerald-600">已完成</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt + "Z").getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    return `${Math.floor(mins / 60)}小时前`;
  };

  const pendingTickets = allTickets.filter((t) => t.status !== "finished");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">厨房显示系统</h2>
          <p className="text-sm text-muted-foreground">{pendingTickets.length} 张待处理小票</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <Layers className="mr-2 h-4 w-4" />刷新
        </Button>
      </div>

      {pendingTickets.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState icon={Layers} title="暂无待处理小票" description="所有订单已完成" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingTickets.map((ticket) => (
            <Card key={ticket.id} className={`border-2 ${getStatusColor(ticket.status)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ticket.order_no}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{ticket.dine_type}</Badge>
                      {ticket.table_no && <Badge variant="outline" className="text-xs">桌号 {ticket.table_no}</Badge>}
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{getElapsed(ticket.created_at)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ScrollArea className="h-40 mb-3">
                  <div className="space-y-2">
                    {ticket.items.map((item) => (
                      <div key={item.id} className="rounded-md bg-muted/50 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {menuItems[item.menu_item_id] || `商品 #${item.menu_item_id}`}
                          </span>
                          <span className="text-sm font-bold text-primary">x{item.qty}</span>
                        </div>
                        {item.spec_code && (
                          <div className="text-xs text-muted-foreground mt-0.5">规格: {item.spec_code}</div>
                        )}
                        {item.note && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>{item.note}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  {ticket.status === "pending" && (
                    <Button size="sm" className="flex-1" onClick={() => onStartTicket(ticket.id)}>
                      <Play className="mr-2 h-3 w-3" />开始制作
                    </Button>
                  )}
                  {ticket.status === "started" && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onFinishTicket(ticket.id)}>
                      <Check className="mr-2 h-3 w-3" />完成出餐
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
