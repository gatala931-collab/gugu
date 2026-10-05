import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface PromptInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  onSubmit?: (data: { text: string }) => void;
}

export const PromptInput = ({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-input bg-surface p-2 shadow-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, onKeyDown, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        "w-full resize-none border-0 bg-transparent px-2 py-1 text-sm outline-hidden placeholder:text-muted-foreground focus:ring-0",
        className
      )}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

export interface PromptInputFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const PromptInputFooter = ({
  className,
  ...props
}: PromptInputFooterProps) => {
  return (
    <div
      className={cn("mt-1 flex items-center gap-2", className)}
      {...props}
    />
  );
};

export interface PromptInputSubmitProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: "ready" | "submitted" | "streaming" | "error";
}

export const PromptInputSubmit = ({
  className,
  status,
  disabled,
  children,
  onClick,
  ...props
}: PromptInputSubmitProps) => {
  const isSubmitting = status === "submitted" || status === "streaming";

  return (
    <Button
      type="button"
      size="sm"
      className={cn("h-8 rounded-xl px-3", className)}
      disabled={disabled || isSubmitting}
      onClick={onClick}
      {...props}
    >
      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  );
};
