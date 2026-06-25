import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  /** Title text. Wrap an emphasized word in <em> for the signature italic accent. */
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** right-aligned actions (buttons) */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, sub, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("page-head", className)}>
      <div>
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
