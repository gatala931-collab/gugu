import * as React from "react";
import { cn } from "@/lib/utils";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant" | "system";
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "ml-auto items-end" : "mr-auto items-start",
      className
    )}
    {...props}
  />
);

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export interface MessageResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const MessageResponse = ({
  children,
  className,
  ...props
}: MessageResponseProps) => {
  return (
    <div
      className={cn("whitespace-pre-wrap leading-relaxed text-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
};
