"use client";

import { Activity, Thermometer, Weight, Ruler, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VitalSigns } from "../types/clinical-history.types";

type VitalSignsCardProps = {
  vitalSigns: VitalSigns;
};

export function VitalSignsCard({ vitalSigns }: VitalSignsCardProps) {
  const t = useTranslations();

  const items = [
    {
      icon: Activity,
      label: t("clinicalHistories.bloodPressure"),
      value: vitalSigns.bloodPressure,
      unit: t("clinicalHistories.bloodPressureUnit"),
    },
    {
      icon: Heart,
      label: t("clinicalHistories.heartRate"),
      value: vitalSigns.heartRate,
      unit: t("clinicalHistories.heartRateUnit"),
    },
    {
      icon: Thermometer,
      label: t("clinicalHistories.temperature"),
      value: vitalSigns.temperature,
      unit: t("clinicalHistories.temperatureUnit"),
    },
    {
      icon: Weight,
      label: t("clinicalHistories.weight"),
      value: vitalSigns.weight,
      unit: t("clinicalHistories.weightUnit"),
    },
    {
      icon: Ruler,
      label: t("clinicalHistories.height"),
      value: vitalSigns.height,
      unit: t("clinicalHistories.heightUnit"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t("clinicalHistories.vitalSigns")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="rounded-full bg-primary/10 p-2">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold">
                  {item.value}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {item.unit}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
