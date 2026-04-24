import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground shadow-lg",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
          success: "border-emerald-500/50",
          error: "border-destructive/50",
          warning: "border-amber-500/50",
          info: "border-blue-500/50",
        },
      }}
      closeButton
    />
  );
}
