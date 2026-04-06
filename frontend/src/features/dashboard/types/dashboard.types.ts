export type RecentConsultation = {
  id: string;
  patientName: string;
  patientLastName: string;
  consultationReason: string;
  createdAt: string;
};

export type DashboardSummary = {
  patientsCount: number;
  appointmentsThisWeek: number;
  totalHistories: number;
  consultationsToday: number;
  recentConsultations: RecentConsultation[];
};
