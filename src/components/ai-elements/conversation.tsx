import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ className, children, ...props }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    return (
      <div
        ref={resolvedRef}
        role="log"
        className={cn("relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Conversation.displayName = "Conversation";

export interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ConversationContent = React.forwardRef<HTMLDivElement, ConversationContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-4 py-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ConversationContent.displayName = "ConversationContent";

export interface ConversationScrollButtonProps extends React.ComponentProps<typeof Button> {}

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  return null;
};
