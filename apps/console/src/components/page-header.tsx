interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
