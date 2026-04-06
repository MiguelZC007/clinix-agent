import { cn } from '@/lib/utils';
import { PageHeader } from '@/ui/molecules/PageHeader';

type ListPageTemplateProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ListPageTemplate({
  title,
  description,
  actions,
  filters,
  children,
  className,
}: ListPageTemplateProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} actions={actions} />

      {filters && <div className="flex flex-wrap items-center gap-4">{filters}</div>}

      <div>{children}</div>
    </div>
  );
}
