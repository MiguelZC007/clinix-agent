import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/ui/molecules/PageHeader';

type FormPageTemplateProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormPageTemplate({
  title,
  description,
  actions,
  children,
  className,
}: FormPageTemplateProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} actions={actions} />

      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
