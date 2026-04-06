'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VitalSignsCard } from './VitalSignsCard';
import type { ClinicalHistory } from '../types/clinical-history.types';

type ClinicalHistoryDetailProps = {
  history: ClinicalHistory;
};

export function ClinicalHistoryDetail({ history }: ClinicalHistoryDetailProps) {
  const t = useTranslations();

  const sections = [
    { label: t('clinicalHistories.reason'), content: history.reason },
    { label: t('clinicalHistories.symptoms'), content: history.symptoms },
    { label: t('clinicalHistories.physicalExam'), content: history.physicalExam },
    { label: t('clinicalHistories.diagnosis'), content: history.diagnosis },
    { label: t('clinicalHistories.treatment'), content: history.treatment },
    { label: t('clinicalHistories.notes'), content: history.notes },
  ];

  return (
    <div className="space-y-6">
      <VitalSignsCard vitalSigns={history.vitalSigns} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('clinicalHistories.consultationInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section, index) => (
            <div key={section.label}>
              {index > 0 && <Separator className="mb-6" />}
              <div>
                <h4 className="mb-2 font-medium text-foreground">{section.label}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {section.content || '-'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
