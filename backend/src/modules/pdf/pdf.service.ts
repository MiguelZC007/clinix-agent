import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface PdfPatientData {
  name: string;
  lastName: string;
  patientNumber: number;
}

interface PdfDoctorData {
  name: string;
  lastName: string;
  specialty: string;
}

interface PdfDiagnosticData {
  name: string;
  description: string;
}

interface PdfPhysicalExamData {
  name: string;
  description: string;
}

interface PdfVitalSignData {
  name: string;
  value: string;
  unit: string;
}

interface PdfMedicationData {
  name: string;
  quantity: number;
  unit: string;
  frequency: string;
  duration: string;
  administrationRoute: string;
  indications: string;
}

interface PdfClinicHistoryData {
  id: string;
  doctorId: string;
  consultationReason: string;
  symptoms: string[];
  treatment: string;
  createdAt: Date;
  patient: PdfPatientData;
  doctor: PdfDoctorData;
  diagnostics: PdfDiagnosticData[];
  physicalExams: PdfPhysicalExamData[];
  vitalSigns: PdfVitalSignData[];
  prescription?: {
    name: string;
    description: string;
    medications: PdfMedicationData[];
  };
}

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateClinicHistoryPdf(
    clinicHistoryId: string,
    doctorId: string,
  ): Promise<Buffer> {
    const clinicHistory = await this.prisma.clinicHistory.findUnique({
      where: { id: clinicHistoryId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialty: true } },
        diagnostics: true,
        physicalExams: true,
        vitalSigns: true,
        prescription: {
          include: { prescriptionMedications: true },
        },
      },
    });

    if (!clinicHistory) {
      throw new NotFoundException('clinic-history-not-found');
    }

    if (clinicHistory.doctorId !== doctorId) {
      throw new ForbiddenException('clinic-history-not-owned-by-doctor');
    }

    const gotenbergUrl = process.env.GOTENBERG_URL;
    if (!gotenbergUrl) {
      throw new InternalServerErrorException('gotenberg-url-not-configured');
    }

    const data = this.mapClinicHistoryForPdf(clinicHistory as never);
    const html = this.buildClinicHistoryHtml(data);

    const formData = new FormData();
    formData.append(
      'files',
      new Blob([html], { type: 'text/html' }),
      'index.html',
    );

    const response = await fetch(
      `${gotenbergUrl.replace(/\/$/, '')}/forms/chromium/convert/html`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException('pdf-generation-failed');
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private mapClinicHistoryForPdf(record: {
    id: string;
    doctorId: string;
    consultationReason: string;
    symptoms: string[];
    treatment: string;
    createdAt: Date;
    patient: {
      user: { name: string; lastName: string };
      patientNumber: number;
    };
    doctor: {
      user: { name: string; lastName: string };
      specialty: { name: string };
    };
    diagnostics: Array<{ name: string; description: string }>;
    physicalExams: Array<{ name: string; description: string }>;
    vitalSigns: Array<{ name: string; value: string; unit: string }>;
    prescription: {
      name: string;
      description: string;
      prescriptionMedications: Array<{
        name: string;
        quantity: number;
        unit: string;
        frequency: string;
        duration: string;
        administrationRoute: string;
        indications: string;
      }>;
    } | null;
  }): PdfClinicHistoryData {
    return {
      id: record.id,
      doctorId: record.doctorId,
      consultationReason: record.consultationReason,
      symptoms: record.symptoms,
      treatment: record.treatment,
      createdAt: record.createdAt,
      patient: {
        name: record.patient.user.name,
        lastName: record.patient.user.lastName,
        patientNumber: record.patient.patientNumber,
      },
      doctor: {
        name: record.doctor.user.name,
        lastName: record.doctor.user.lastName,
        specialty: record.doctor.specialty.name,
      },
      diagnostics: record.diagnostics.map((item) => ({
        name: item.name,
        description: item.description,
      })),
      physicalExams: record.physicalExams.map((item) => ({
        name: item.name,
        description: item.description,
      })),
      vitalSigns: record.vitalSigns.map((item) => ({
        name: item.name,
        value: item.value,
        unit: item.unit,
      })),
      prescription: record.prescription
        ? {
            name: record.prescription.name,
            description: record.prescription.description,
            medications: record.prescription.prescriptionMedications.map(
              (item) => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                frequency: item.frequency,
                duration: item.duration,
                administrationRoute: item.administrationRoute,
                indications: item.indications,
              }),
            ),
          }
        : undefined,
    };
  }

  private buildClinicHistoryHtml(data: PdfClinicHistoryData): string {
    const patientName = `${data.patient.name} ${data.patient.lastName}`;
    const doctorName = `${data.doctor.name} ${data.doctor.lastName}`;
    const createdAt = data.createdAt.toLocaleString('es-BO');

    const renderList = (
      title: string,
      items: string[],
      emptyLabel = 'Sin registros',
    ) => `
      <section>
        <h2>${title}</h2>
        ${items.length > 0 ? `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>` : `<p>${emptyLabel}</p>`}
      </section>
    `;

    const diagnostics = data.diagnostics.map(
      (item) => `<strong>${item.name}:</strong> ${item.description}`,
    );
    const physicalExams = data.physicalExams.map(
      (item) => `<strong>${item.name}:</strong> ${item.description}`,
    );
    const vitalSigns = data.vitalSigns.map((item) =>
      `${item.name}: ${item.value} ${item.unit}`.trim(),
    );
    const medications =
      data.prescription?.medications.map(
        (item) =>
          `<strong>${item.name}</strong> — ${item.quantity} ${item.unit}, ${item.frequency}, ${item.duration}, vía ${item.administrationRoute}. ${item.indications}`,
      ) ?? [];

    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Historia clínica ${data.id}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
      h1, h2 { color: #0f172a; }
      .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
      .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
      section { margin-bottom: 20px; }
      ul { padding-left: 20px; }
      .muted { color: #475569; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Historia clínica</h1>
    <p class="muted">Generado el ${createdAt}</p>

    <div class="meta">
      <div class="card"><strong>Paciente:</strong><br/>${patientName}</div>
      <div class="card"><strong>Número:</strong><br/>${data.patient.patientNumber}</div>
      <div class="card"><strong>Médico:</strong><br/>${doctorName}</div>
      <div class="card"><strong>Especialidad:</strong><br/>${data.doctor.specialty}</div>
      <div class="card"><strong>Motivo de consulta:</strong><br/>${data.consultationReason}</div>
    </div>

    ${renderList('Síntomas', data.symptoms)}
    ${renderList('Diagnósticos', diagnostics)}
    ${renderList('Exámenes físicos', physicalExams)}
    ${renderList('Signos vitales', vitalSigns)}

    <section>
      <h2>Tratamiento</h2>
      <p>${data.treatment}</p>
    </section>

    <section>
      <h2>Receta</h2>
      <p><strong>${data.prescription?.name ?? 'Sin receta'}</strong></p>
      <p>${data.prescription?.description ?? 'No se registró receta.'}</p>
      ${medications.length > 0 ? `<ul>${medications.map((item) => `<li>${item}</li>`).join('')}</ul>` : '<p>Sin medicamentos recetados.</p>'}
    </section>
  </body>
</html>`;
  }
}
