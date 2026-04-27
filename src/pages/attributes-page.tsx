import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tag, HelpCircle } from "lucide-react";

interface AttributeTemplate {
  id: number;
  entity_type: string;
  category: string | null;
  attr_code: string;
  attr_name: string;
  data_type: string;
  unit: string | null;
  default_value: number | null;
  formula: string | null;
}

interface AttributesPageProps {
  attributeTemplates: AttributeTemplate[];
}

export function AttributesPage({ attributeTemplates }: AttributesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">属性模板</h2>
          <p className="text-sm text-muted-foreground">管理批次、材料和配方的自定义属性</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm p-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">什么是属性模板？</p>
              <p>属性模板用于定义材料、批次或配方的<strong>自定义追踪字段</strong>，例如：</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>冰衣率</strong> — 冷冻海鲜表面的冰衣重量占比</li>
                <li><strong>出成率</strong> — 原材料加工后的可用比例</li>
                <li><strong>季节性系数</strong> — 不同季节的品质/价格波动因子</li>
                <li><strong>品质等级</strong> — A/B/C 等级评分</li>
              </ul>
              <p className="text-muted-foreground">创建批次时，系统会根据模板自动添加这些属性字段，用于更精确的成本核算和库存管理。</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            属性模板列表
          </CardTitle>
          <CardDescription>共 {attributeTemplates.length} 个模板</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>代码</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>实体类型</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>数据类型</TableHead>
                <TableHead className="text-right">默认值</TableHead>
                <TableHead>公式</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributeTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                      {template.attr_code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{template.attr_name}</TableCell>
                  <TableCell className="text-muted-foreground">{template.entity_type}</TableCell>
                  <TableCell className="text-muted-foreground">{template.category || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{template.data_type}</TableCell>
                  <TableCell className="text-right">{template.default_value ?? "-"}</TableCell>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                      {template.formula || "-"}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
