import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, ChefHat, ShoppingCart, Layers, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface DashboardProps {
  materialsCount: number;
  recipesCount: number;
  ordersCount: number;
  batchesCount: number;
  orders: Array<{
    id: number;
    order_no: string;
    status: string;
    amount_total: number;
  }>;
  inventorySummary: Array<{
    material_id: number;
    material_name: string;
    available_qty: number;
  }>;
  loading?: boolean;
}

export function DashboardPage({
  materialsCount,
  recipesCount,
  ordersCount,
  batchesCount,
  orders,
  inventorySummary,
  loading = false,
}: DashboardProps) {
  const lowStockItems = inventorySummary.filter((s) => s.available_qty < 10);

  const totalInventory = inventorySummary.reduce((sum, s) => sum + s.available_qty, 0);
  const totalOrderValue = orders.reduce((sum, o) => sum + o.amount_total, 0);
  const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;

  const chartData = inventorySummary.slice(0, 8).map((s) => ({
    name: s.material_name.length > 6 ? s.material_name.slice(0, 6) + "..." : s.material_name,
    qty: s.available_qty,
  }));

  const inventoryChartConfig = {
    qty: {
      label: "库存量",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const statusChartConfig = {
    value: {
      label: "订单数",
    },
  } satisfies ChartConfig;

  const statusData = [
    { name: "待提交", value: orders.filter((o) => o.status === "pending").length },
    { name: "已提交", value: orders.filter((o) => o.status === "submitted").length },
    { name: "已完成", value: orders.filter((o) => o.status === "ready").length },
    { name: "已取消", value: orders.filter((o) => o.status === "cancelled").length },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">仪表板</h2>
        <p className="text-sm text-muted-foreground">系统概览与关键指标</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">原材料总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold">{materialsCount}</div>}
            <p className="text-xs text-muted-foreground">活跃材料</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">配方数量</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold">{recipesCount}</div>}
            <p className="text-xs text-muted-foreground">活跃配方</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold">{ordersCount}</div>}
            <p className="text-xs text-muted-foreground">累计订单 · 均值 ¥{loading ? "0.00" : avgOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存总量</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 mb-1" /> : <div className="text-2xl font-bold">{totalInventory.toFixed(1)}</div>}
            <p className="text-xs text-muted-foreground">{loading ? "-" : batchesCount} 个活跃批次</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />库存分布</CardTitle>
            <CardDescription>Top 8 材料可用库存</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : chartData.length === 0 ? (
              <EmptyState icon={BarChart3} title="暂无数据" description="库存数据将在此显示" />
            ) : (
              <ChartContainer config={inventoryChartConfig} className="h-[250px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fillQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-qty)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-qty)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    indicator="dot"
                    labelClassName="font-medium"
                  />
                  <Area
                    dataKey="qty"
                    type="natural"
                    fill="url(#fillQty)"
                    stroke="var(--color-qty)"
                    strokeWidth={2}
                    animationDuration={600}
                    animationBegin={200}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />订单状态分布</CardTitle>
            <CardDescription>按状态统计订单数量</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : statusData.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="暂无数据" description="订单状态分布将在此显示" />
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={statusChartConfig} className="h-[200px] w-[50%]">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      indicator="dot"
                      formatter={(value: unknown) => [`${value}`, "订单数"]}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2 flex-1">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{s.name}</span>
                      </div>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              最近订单
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="暂无订单" description="创建订单后将在此显示" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">总额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map((order, i) => (
                    <TableRow key={order.id} className="animate-stagger" style={{ animationDelay: `${i * 50}ms` }}>
                      <TableCell className="font-medium">{order.order_no}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{order.amount_total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              库存预警
            </CardTitle>
            <CardDescription>可用库存低于 10 的材料</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[70%]" />
              </div>
            ) : lowStockItems.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="无库存预警" description="所有库存充足" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>材料</TableHead>
                    <TableHead className="text-right">可用量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((summary) => (
                    <TableRow key={summary.material_id}>
                      <TableCell className="font-medium">{summary.material_name}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {summary.available_qty.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
