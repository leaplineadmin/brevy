import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warning' | 'success' | 'error'
}

const CustomAlert = React.forwardRef<HTMLDivElement, CustomAlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-gray-50 border-gray-200 text-gray-900",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
      success: "bg-green-50 border-green-200 text-green-900",
      error: "bg-red-50 border-red-200 text-red-900"
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          // Styles de base sans les sélecteurs CSS complexes
          "relative w-full rounded-lg border p-4 flex items-center gap-3",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CustomAlert.displayName = "CustomAlert"

const CustomAlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm flex-1", className)}
    {...props}
  />
))

CustomAlertDescription.displayName = "CustomAlertDescription"

export { CustomAlert, CustomAlertDescription }