import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** adds the hover-lift treatment for clickable cards */
  hover?: boolean;
  /** dark navy feature card */
  navy?: boolean;
}

export function Card({ className, hover, navy, ...props }: CardProps) {
  return (
    <div
      className={cn("card", hover && "card-hover", navy && "card-navy", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-head", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("card-title", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}
