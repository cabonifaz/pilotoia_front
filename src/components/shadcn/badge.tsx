import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border border-secondary-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        info:
          "border-transparent bg-info text-info-foreground shadow hover:bg-info/80",
        purple:
          "border-transparent bg-purple text-purple-foreground shadow hover:bg-purple/80",
        orange:
          "border-transparent bg-orange text-orange-foreground shadow hover:bg-orange/80",
        gray:
          "border-transparent bg-gray text-gray-foreground shadow hover:bg-gray/80",
        teal:
          "border-transparent bg-teal text-teal-foreground shadow hover:bg-teal/80",
        cyan:
          "border-transparent bg-cyan text-cyan-foreground shadow hover:bg-cyan/80",
        pink:
          "border-transparent bg-pink text-pink-foreground shadow hover:bg-pink/80",
        blue:
          "border-transparent bg-blue text-blue-foreground shadow hover:bg-blue/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
