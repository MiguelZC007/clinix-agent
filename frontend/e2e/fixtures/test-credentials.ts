export const E2E_TEST_CREDENTIALS = {
  admin: {
    email: "admin@clinix.com",
    phone: "+59170000001",
    phoneInput: "70000001",
    password: "Admin123!",
    role: "ADMIN",
  },
  doctor: {
    email: "doctor.test@clinix.com",
    phone: "+59170000002",
    phoneInput: "70000002",
    password: "Doctor123!",
    role: "DOCTOR",
  },
  patient: {
    email: "patient.test@clinix.com",
    phone: "+59170000003",
    phoneInput: "70000003",
    password: "Patient123!",
    role: "PATIENT",
  },
  e2e: {
    email: "test-e2e@clinix.local",
    phone: "+59170000000",
    phoneInput: "70000000",
    password: "Test123!",
    role: "DOCTOR",
  },
} as const;
