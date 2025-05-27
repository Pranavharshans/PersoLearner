import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl bg-card text-card-foreground transition-all duration-300 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "border border-border shadow-soft hover:shadow-soft-lg",
        elevated: "border border-border shadow-soft-lg hover:shadow-soft-xl",
        
        // Glass morphism variants
        glass: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-glass hover:bg-white/10 hover:shadow-glass-lg",
        "glass-strong": "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-glass-lg hover:bg-white/15 hover:shadow-glass-xl",
        "glass-dark": "bg-black/20 backdrop-blur-xl border border-white/5 shadow-glass hover:bg-black/30 hover:shadow-glass-lg",
        
        // Gradient variants
        gradient: "bg-gradient-to-br from-card via-card/95 to-card/90 border border-border shadow-soft-lg",
        "gradient-primary": "bg-gradient-to-br from-primary-500/10 via-card to-primary-500/5 border border-primary-200/20 shadow-primary",
        "gradient-secondary": "bg-gradient-to-br from-secondary-500/10 via-card to-secondary-500/5 border border-secondary-200/20 shadow-secondary",
        "gradient-cosmic": "bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border border-purple-200/20 shadow-glow-purple",
        "gradient-mesh": "bg-gradient-mesh border border-white/20 shadow-glass-lg",
        
        // Professional variants
        premium: "bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-depth-xl text-white",
        minimal: "bg-white border border-gray-100 shadow-xs hover:shadow-sm",
        outlined: "border-2 border-border bg-transparent hover:bg-accent/5 hover:border-primary/20",
        
        // Effect variants
        glow: "border border-border shadow-glow hover:shadow-glow-lg",
        "glow-blue": "border border-blue-200/30 shadow-glow-blue hover:shadow-glow-blue",
        "glow-purple": "border border-purple-200/30 shadow-glow-purple hover:shadow-glow-purple", 
        "glow-pink": "border border-pink-200/30 shadow-glow-pink hover:shadow-glow-pink",
        
        // Surface variants
        muted: "bg-muted/50 border border-border shadow-soft",
        accent: "bg-accent/30 border border-accent shadow-soft",
        
        // Depth variants
        floating: "shadow-depth-lg hover:shadow-depth-xl border-0",
        sunken: "shadow-inner bg-muted/30 border border-border",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
        "2xl": "p-12",
        none: "p-0",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        "lift-lg": "hover:-translate-y-2",
        scale: "hover:scale-[1.02]",
        "scale-lg": "hover:scale-[1.05]",
        glow: "hover:shadow-glow-lg",
        rotate: "hover:rotate-1",
      },
      interactive: {
        true: "cursor-pointer active:scale-[0.98] will-change-transform",
        false: "",
      },
      animate: {
        true: "group-hover:animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "none",
      interactive: false,
      animate: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  shimmer?: boolean
  pattern?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, interactive, animate, shimmer, pattern, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, hover, interactive, animate, className }))}
      {...props}
    >
      {/* Background pattern */}
      {pattern && (
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full dot-pattern" />
        </div>
      )}
      
      {/* Shimmer effect */}
      {shimmer && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    center?: boolean
  }
>(({ className, center, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 pb-4",
      center && "text-center items-center",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
    size?: "sm" | "default" | "lg" | "xl"
  }
>(({ className, gradient, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg",
    default: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }
  
  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-tight tracking-tight",
        sizeClasses[size],
        gradient && "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    muted?: boolean
  }
>(({ className, muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted && "text-muted-foreground",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean
  }
>(({ className, noPadding, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "pt-4",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    center?: boolean
    border?: boolean
  }
>(({ className, center, border, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-4",
      center && "justify-center",
      border && "border-t border-border mt-4 pt-4",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Additional card components for professional layouts
const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src: string
    alt: string
    aspectRatio?: "square" | "video" | "photo" | "portrait"
  }
>(({ className, src, alt, aspectRatio = "photo", ...props }, ref) => {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    photo: "aspect-photo",
    portrait: "aspect-portrait",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl",
        aspectClasses[aspectRatio],
        className
      )}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  )
})
CardImage.displayName = "CardImage"

const CardBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "danger"
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent-foreground",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
  }
  
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})
CardBadge.displayName = "CardBadge"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardImage,
  CardBadge,
  cardVariants 
} 