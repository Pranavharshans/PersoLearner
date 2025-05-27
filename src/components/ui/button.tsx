import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        outline: "border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md hover:border-primary/50 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg hover:-translate-y-0.5 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-95",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",
        
        // Premium gradient variants
        gradient: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-secondary-700 hover:-translate-y-0.5 active:scale-95 relative",
        "gradient-cosmic": "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 bg-size-200 hover:bg-right",
        "gradient-sunset": "bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        "gradient-ocean": "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        
        // Glass morphism variants
        glass: "bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-glass hover:bg-white/20 hover:shadow-glass-lg hover:-translate-y-0.5 active:scale-95",
        "glass-dark": "bg-black/20 text-white backdrop-blur-md border border-white/10 shadow-glass hover:bg-black/30 hover:shadow-glass-lg hover:-translate-y-0.5 active:scale-95",
        
        // Glow effects
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95",
        "glow-blue": "bg-blue-500 text-white shadow-glow-blue hover:shadow-glow-blue hover:scale-105 active:scale-95",
        "glow-purple": "bg-purple-500 text-white shadow-glow-purple hover:shadow-glow-purple hover:scale-105 active:scale-95",
        "glow-pink": "bg-pink-500 text-white shadow-glow-pink hover:shadow-glow-pink hover:scale-105 active:scale-95",
        
        // Professional variants
        premium: "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-xl hover:from-gray-800 hover:to-gray-600 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 border border-gray-600",
        minimal: "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-gray-300 active:scale-95",
        
        // Solid color variants
        success: "bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        warning: "bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        danger: "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
        info: "bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-semibold",
        "2xl": "h-16 rounded-2xl px-12 text-xl font-semibold",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
        "icon-xl": "h-14 w-14 rounded-2xl",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  shimmer?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading, 
    loadingText,
    leftIcon, 
    rightIcon, 
    children, 
    disabled, 
    shimmer = false,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect overlay */}
        {shimmer && (
          <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="mr-2 flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}
        
        {/* Content */}
        <span className="relative z-10">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
        
        {/* Gradient variants background animation */}
        {(variant?.includes('gradient') || variant === 'glow') && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 