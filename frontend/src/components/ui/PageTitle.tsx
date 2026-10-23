import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const pageTitleVariants = cva("flex items-center gap-2.5");

export const pageTitleBarVariants = cva(
  "h-0.5 w-accent-line rounded-full bg-primary",
);

export const pageTitleTextVariants = cva(
  "text-meta font-bold uppercase tracking-title text-black",
);

export interface PageTitleDataProps {
  title: string;
}

export interface PageTitleProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageTitleVariants> {
  children?: ReactNode;
}

export default function PageTitle({
  title,
  className,
  children,
  ...props
}: PageTitleDataProps & PageTitleProps) {
  return (
    <div className={cn(pageTitleVariants(), className)} {...props}>
      <span
        className={cn(pageTitleBarVariants())}
        aria-hidden="true"
      />
      <p className={cn(pageTitleTextVariants())}>
        {title}
      </p>
      {children}
    </div>
  );
}
