import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Trophy, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [salesData, setSalesData] = useState<[string, number, number][]>([]);
  const [categoryData, setCategoryData] = useState<[string, number, number][]>([]);
  const [profitData, setProfitData] = useState<[string, number, number, number][]>([]);
  const [topItems, setTopItems] = useState<[string, number, number, number][]>([]);
  const [consumptionData, setConsumptionData] = useState<[string, number, number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const [sales, categories, profit, top, consumption] = await Promise.all([
        invoke<[string, number, number][]>("get_sales_report", { startDate, endDate }),
        invoke<[string, number, number][]>("get_sales_by_category", { startDate, endDate }),
        invoke<[string, number, number, number][]>("get_gross_profit_report", { startDate, endDate }),
        invoke<[string, number, number, number][]>("get_top_selling_items", { startDate, endDate, limit: 10 }),
        invoke<[string, number, number, number][]>("get_material_consumption_report", { startDate, endDate }),
      ]);
      setSalesData(sales);
      setCategoryData(categories);
      setProfitData(profit);
      setTopItems(top);
      setConsumptionData(consumption);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, []);

  const totalSales = salesData.reduce((sum, [, amt]) => sum + amt, 0);
  const totalOrders = salesData.reduce((sum, [, , cnt]) => sum + cnt, 0);
  const totalRevenue = profitData.reduce((sum, [, rev]) => sum + rev, 0);
  const totalCost = profitData.reduce((sum, [, , cost]) => sum + cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">数据报表</h2>
          <p className="text-sm text-muted-foreground">销售分析、毛利计算、热销排行</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          报表加载失败: {error}
          <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">关闭</button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" />日期范围</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={loadReports} disabled={loading}>查询</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">總銷售額</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">¥{totalSales.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">總訂單數</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">毛利</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">¥{totalProfit.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">毛利率</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{profitMargin}%</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />销售报表</TabsTrigger>
          <TabsTrigger value="profit" className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />毛利报表</TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-1"><Trophy className="h-4 w-4" />热销排行</TabsTrigger>
          <TabsTrigger value="category">分类销售</TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-1">原料消耗</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>每日销售额</CardTitle><CardDescription>按日期统计销售金额和订单数</CardDescription></CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <EmptyState icon={BarChart3} title="暂无数据" description="选择日期范围查询销售数据" />
              ) : (
                <>
                  <div className="h-[300px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.map(([date, amount, count]) => ({ date, amount, count }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: unknown, name: unknown) => {
                          const display = typeof value === "number" ? `¥${value.toFixed(2)}` : String(value ?? "");
                          const label = name === "amount" ? "销售额" : name === "count" ? "订单数" : String(name ?? "");
                          return [display, label];
                        }} />
                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} name="销售额" animationDuration={600} animationBegin={200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>日期</TableHead><TableHead className="text-right">销售额</TableHead><TableHead className="text-right">订单数</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map(([date, amount, count], i) => (
                        <TableRow key={date} className="animate-stagger" style={{ animationDelay: `${i * 40}ms` }}>
                          <TableCell className="font-mono text-xs">{date}</TableCell>
                          <TableCell className="text-right font-medium">¥{amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>每日毛利</CardTitle><CardDescription>收入、成本、毛利對比</CardDescription></CardHeader>
            <CardContent>
              {profitData.length === 0 ? (
                <EmptyState icon={TrendingUp} title="暂无数据" description="选择日期范围查询毛利数据" />
              ) : (
                <>
                  <div className="h-[300px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitData.map(([date, revenue, cost, profit]) => ({ date, revenue, cost, profit }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: unknown) => [`¥${typeof value === "number" ? value.toFixed(2) : value}`, ""]} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="收入" animationDuration={600} animationBegin={200} />
                        <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2} name="成本" animationDuration={600} animationBegin={400} />
                        <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="毛利" animationDuration={600} animationBegin={600} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>日期</TableHead><TableHead className="text-right">收入</TableHead><TableHead className="text-right">成本</TableHead><TableHead className="text-right">毛利</TableHead><TableHead className="text-right">毛利率</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitData.map(([date, revenue, cost, profit]) => {
                        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";
                        return (
                          <TableRow key={date}>
                            <TableCell className="font-mono text-xs">{date}</TableCell>
                            <TableCell className="text-right">¥{revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">¥{cost.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-medium ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>¥{profit.toFixed(2)}</TableCell>
                            <TableCell className="text-right"><Badge variant={parseFloat(margin) >= 30 ? "default" : parseFloat(margin) >= 15 ? "secondary" : "destructive"}>{margin}%</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" />热销商品排行</CardTitle><CardDescription>按销量排序 Top 10</CardDescription></CardHeader>
            <CardContent>
              {topItems.length === 0 ? (
                <EmptyState icon={Trophy} title="暂无数据" description="销售数据将显示热销排行" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="w-12">排名</TableHead><TableHead>商品</TableHead><TableHead className="text-right">销量</TableHead><TableHead className="text-right">销售额</TableHead><TableHead className="text-right">均价</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {topItems.map(([name, revenue, qty, avgPrice], idx) => (
                      <TableRow key={name} className="animate-stagger" style={{ animationDelay: `${idx * 50}ms` }}>
                        <TableCell>
                          <Badge variant={idx < 3 ? "default" : "secondary"} className="w-8 h-6 flex items-center justify-center">{idx + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right font-medium">¥{revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">¥{avgPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>分类销售</CardTitle><CardDescription>按菜单分类统计</CardDescription></CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <EmptyState icon={BarChart3} title="暂无数据" description="分类销售统计将在此显示" />
              ) : (
                <>
                  <div className="h-[300px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.map(([name, amount, qty]) => ({ name: name || "未分類", value: amount, qty }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name ?? ""} ${percent != null ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={600}
                          animationBegin={200}
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: unknown) => [`¥${typeof value === "number" ? value.toFixed(2) : value}`, "销售额"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>分类</TableHead><TableHead className="text-right">销售额</TableHead><TableHead className="text-right">销量</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.map(([name, amount, qty], i) => (
                        <TableRow key={name} className="animate-stagger" style={{ animationDelay: `${i * 50}ms` }}>
                          <TableCell className="font-medium">{name || "未分類"}</TableCell>
                          <TableCell className="text-right font-medium">¥{amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumption" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>原料消耗报表</CardTitle>
              <CardDescription>按日期范围统计原料消耗数量和成本</CardDescription>
            </CardHeader>
            <CardContent>
              {consumptionData.length === 0 ? (
                <EmptyState icon={BarChart3} title="暂无数据" description="选择日期范围查询原料消耗数据" />
              ) : (
                <>
                  <div className="h-[300px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionData.map(([name, qty, , cost]) => ({ name, qty, cost }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" className="text-xs" />
                        <Tooltip formatter={(value: unknown, name) => [String(name) === "qty" ? `${value}` : `¥${value}`, String(name) === "qty" ? "消耗数量" : "成本"]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="qty" name="消耗数量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="cost" name="成本(¥)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>原料</TableHead>
                        <TableHead className="text-right">消耗数量</TableHead>
                        <TableHead className="text-right">平均成本</TableHead>
                        <TableHead className="text-right">总成本</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumptionData.map(([name, qty, avgCost, totalCost], i) => (
                        <TableRow key={name} className="animate-stagger" style={{ animationDelay: `${i * 50}ms` }}>
                          <TableCell className="font-medium">{name || "未知名"}</TableCell>
                          <TableCell className="text-right">{qty.toFixed(2)}</TableCell>
                          <TableCell className="text-right">¥{avgCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">¥{totalCost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
