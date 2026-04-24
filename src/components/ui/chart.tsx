import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polygon[stroke='#000']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-sector]:stroke-background [&_.recharts-sector[stroke='#000']]:stroke-border [&_.recharts-surface]:stroke-border",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorVars: Array<{ name: string; value: string }> = []
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "object" && "color" in value && value.color) {
      colorVars.push({ name: `--color-${key}`, value: value.color })
    }
  }

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
[data-chart=${id}] {
${colorVars.map((v) => `  ${v.name}: ${v.value};`).join("\n")}
}
`,
    }} />
  )
}

function ChartTooltip({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    name?: string
    value?: unknown
    color?: string
    payload?: Record<string, unknown>
    fill?: string
  }>
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: unknown, payload: unknown) => React.ReactNode
  labelClassName?: string
  formatter?: (value: unknown, name: unknown, props: unknown, index: number, payload: unknown) => React.ReactNode
  nameKey?: string
  labelKey?: string
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = config[key as keyof typeof config]
    const value = itemConfig?.label || label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) return null
    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemConfig = config[key as keyof typeof config]
          const indicatorColor = item.payload?.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed",
                        }
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value !== undefined && (
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : String(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    name?: string
    value?: unknown
    color?: string
    payload?: Record<string, unknown>
    fill?: string
  }>
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: unknown, payload: unknown) => React.ReactNode
  labelClassName?: string
  formatter?: (value: unknown, name: unknown, props: unknown, index: number, payload: unknown) => React.ReactNode
  nameKey?: string
  labelKey?: string
}) {
  return (
    <ChartTooltip
      active={active}
      payload={payload}
      className={className}
      indicator={indicator}
      hideLabel={hideLabel}
      hideIndicator={hideIndicator}
      label={label}
      labelFormatter={labelFormatter}
      labelClassName={labelClassName}
      formatter={formatter}
      nameKey={nameKey}
      labelKey={labelKey}
    />
  )
}

function ChartLegend({
  content,
  className,
  payload,
}: {
  content?: React.ComponentType<{ payload: Array<{ value: string; color?: string }> }>
  className?: string
  payload?: Array<{ value: string; color?: string }>
}) {
  if (!content || !payload?.length) return null
  const LegendContent = content
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      <LegendContent payload={payload} />
    </div>
  )
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
}: {
  className?: string
  hideIcon?: boolean
  payload?: Array<{ value: string; color?: string }>
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item) => {
        const itemConfig = config[item.value as keyof typeof config]
        return (
          <div key={item.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {!hideIcon && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || itemConfig?.color }}
              />
            )}
            {itemConfig?.label || item.value}
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
