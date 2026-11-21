import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:pointer-events-none disabled:opacity-40 data-[state=on]:bg-teal-700 data-[state=on]:text-white",
  {
    variants: {
      variant: {
        default: "bg-transparent text-neutral-600 hover:bg-neutral-100",
        outline: "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
      },
      size: { default: "h-8 px-3", sm: "h-7 px-2.5", lg: "h-9 px-4 text-sm" },
    },
    defaultVariants: { variant: "outline", size: "default" },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
