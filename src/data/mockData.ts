// ---- USERS ----
export interface Doctor {
  id: string; role: "doctor"; name: string; email: string; hospital: string; license: string; specialization: string; status: "active" | "inactive";
}
export interface Vendor {
  id: string; role: "vendor"; name: string; location: string; phone: string; bankDetails: string; walletBalance: number; diariesSold: number; commissionRate: number; status: "active" | "inactive";
}
export interface Assistant {
  id: string; role: "assistant"; name: string; email: string; doctorId: string; permissions: { viewPatients: boolean; callPatients: boolean; exportData: boolean; sendNotifications: boolean }; status: "active" | "inactive";
}
export interface SuperAdmin {
  id: string; role: "super_admin"; name: string; email: string;
}
export type User = Doctor | Vendor | Assistant | SuperAdmin;

export interface Patient {
  id: string; name: string; age: number; phone: string; diaryId: string; doctorId: string; vendorId: string; registeredDate: string; status: "active" | "pending" | "inactive"; stage: string; lastEntry: string; riskLevel: "normal" | "high" | "critical"; treatmentPlan: string;
}

export interface Diary {
  id: string; serialNumber: string; status: "pending" | "active" | "inactive" | "rejected"; patientId: string; vendorId: string; doctorId: string; activationDate: string; salePrice: number; vendorCommission: number;
}

export interface DiaryEntry {
  id: string; patientId: string; diaryId: string; pageNumber: number; uploadDate: string; parsedData: { painLevel: number; nausea: boolean; fever: boolean; appetite: string; sleepQuality: string; medications: string[] }; flagged: boolean; doctorReviewed: boolean;
}

export interface Notification {
  id: string; userId: string; type: "alert" | "info" | "reminder"; severity: "high" | "medium" | "low"; message: string; patientId?: string; timestamp: string; read: boolean;
}

export interface AuditLog {
  id: string; timestamp: string; userId: string; userName: string; role: string; action: string; details: string; ipAddress: string;
}

export interface Task {
  id: string; title: string; assignedBy: string; priority: "high" | "medium" | "low"; dueDate: string; status: "pending" | "in_progress" | "completed"; patientIds?: string[];
}

// ---- MOCK DATA ----
export const doctors: Doctor[] = [
  { id: "D001", role: "doctor", name: "Dr. Priya Sharma", email: "priya.sharma@aiims.com", hospital: "AIIMS Delhi", license: "MCI-DL-12345", specialization: "Oncology", status: "active" },
  { id: "D002", role: "doctor", name: "Dr. Rajesh Kumar", email: "rajesh.k@tata.com", hospital: "Tata Memorial", license: "MCI-MH-23456", specialization: "Surgery", status: "active" },
  { id: "D003", role: "doctor", name: "Dr. Anita Gupta", email: "anita.g@apollo.com", hospital: "Apollo Chennai", license: "MCI-TN-34567", specialization: "Radiotherapy", status: "active" },
  { id: "D004", role: "doctor", name: "Dr. Vikram Singh", email: "vikram.s@fortis.com", hospital: "Fortis Gurgaon", license: "MCI-HR-45678", specialization: "Oncology", status: "active" },
  { id: "D005", role: "doctor", name: "Dr. Meera Patel", email: "meera.p@apollo.com", hospital: "Apollo Mumbai", license: "MCI-MH-56789", specialization: "Surgery", status: "active" },
  { id: "D006", role: "doctor", name: "Dr. Suresh Nair", email: "suresh.n@amrita.com", hospital: "Amrita Kochi", license: "MCI-KL-67890", specialization: "Oncology", status: "active" },
  { id: "D007", role: "doctor", name: "Dr. Kavitha Reddy", email: "kavitha.r@nims.com", hospital: "NIMS Hyderabad", license: "MCI-TS-78901", specialization: "Radiotherapy", status: "inactive" },
  { id: "D008", role: "doctor", name: "Dr. Arun Joshi", email: "arun.j@sms.com", hospital: "SMS Hospital Jaipur", license: "MCI-RJ-89012", specialization: "Oncology", status: "active" },
  { id: "D009", role: "doctor", name: "Dr. Sneha Kapoor", email: "sneha.k@medanta.com", hospital: "Medanta Gurgaon", license: "MCI-HR-90123", specialization: "Surgery", status: "active" },
  { id: "D010", role: "doctor", name: "Dr. Ramesh Iyer", email: "ramesh.i@cmc.com", hospital: "CMC Vellore", license: "MCI-TN-01234", specialization: "Oncology", status: "active" },
  { id: "D011", role: "doctor", name: "Dr. Pooja Malhotra", email: "pooja.m@max.com", hospital: "Max Delhi", license: "MCI-DL-11234", specialization: "Surgery", status: "active" },
  { id: "D012", role: "doctor", name: "Dr. Ashok Banerjee", email: "ashok.b@cmri.com", hospital: "CMRI Kolkata", license: "MCI-WB-22345", specialization: "Radiotherapy", status: "active" },
  { id: "D013", role: "doctor", name: "Dr. Lakshmi Rao", email: "lakshmi.r@kidwai.com", hospital: "Kidwai Bangalore", license: "MCI-KA-33456", specialization: "Oncology", status: "active" },
  { id: "D014", role: "doctor", name: "Dr. Nikhil Chopra", email: "nikhil.c@pgimer.com", hospital: "PGIMER Chandigarh", license: "MCI-CH-44567", specialization: "Surgery", status: "active" },
  { id: "D015", role: "doctor", name: "Dr. Deepa Menon", email: "deepa.m@rcc.com", hospital: "RCC Trivandrum", license: "MCI-KL-55678", specialization: "Oncology", status: "active" },
];

export const vendors: Vendor[] = [
  { id: "V001", role: "vendor", name: "Rajesh Medical Store", location: "Delhi", phone: "+91-9876543210", bankDetails: "HDFC-XXXX1234", walletBalance: 2500, diariesSold: 50, commissionRate: 50, status: "active" },
  { id: "V002", role: "vendor", name: "MedPlus Pharmacy", location: "Mumbai", phone: "+91-9876543211", bankDetails: "ICICI-XXXX2345", walletBalance: 4200, diariesSold: 84, commissionRate: 50, status: "active" },
  { id: "V003", role: "vendor", name: "Apollo Pharmacy", location: "Chennai", phone: "+91-9876543212", bankDetails: "SBI-XXXX3456", walletBalance: 1800, diariesSold: 36, commissionRate: 50, status: "active" },
  { id: "V004", role: "vendor", name: "Netmeds Store", location: "Bangalore", phone: "+91-9876543213", bankDetails: "AXIS-XXXX4567", walletBalance: 6500, diariesSold: 100, commissionRate: 50, status: "active" },
  { id: "V005", role: "vendor", name: "HealthKart", location: "Kolkata", phone: "+91-9876543214", bankDetails: "PNB-XXXX5678", walletBalance: 950, diariesSold: 19, commissionRate: 50, status: "active" },
  { id: "V006", role: "vendor", name: "PharmEasy Delhi", location: "Delhi", phone: "+91-9876543215", bankDetails: "BOB-XXXX6789", walletBalance: 3100, diariesSold: 62, commissionRate: 50, status: "active" },
  { id: "V007", role: "vendor", name: "MedLife Stores", location: "Hyderabad", phone: "+91-9876543216", bankDetails: "KOTAK-XXXX7890", walletBalance: 750, diariesSold: 15, commissionRate: 50, status: "active" },
  { id: "V008", role: "vendor", name: "Wellness Forever", location: "Pune", phone: "+91-9876543217", bankDetails: "HDFC-XXXX8901", walletBalance: 5400, diariesSold: 78, commissionRate: 50, status: "active" },
  { id: "V009", role: "vendor", name: "Guardian Pharmacy", location: "Chennai", phone: "+91-9876543218", bankDetails: "ICICI-XXXX9012", walletBalance: 2200, diariesSold: 44, commissionRate: 50, status: "active" },
  { id: "V010", role: "vendor", name: "Sanjivani Medical", location: "Jaipur", phone: "+91-9876543219", bankDetails: "SBI-XXXX0123", walletBalance: 1100, diariesSold: 22, commissionRate: 50, status: "active" },
  { id: "V011", role: "vendor", name: "City Chemist", location: "Mumbai", phone: "+91-9876543220", bankDetails: "AXIS-XXXX1234", walletBalance: 8900, diariesSold: 95, commissionRate: 50, status: "active" },
  { id: "V012", role: "vendor", name: "Lifeline Pharma", location: "Kolkata", phone: "+91-9876543221", bankDetails: "PNB-XXXX2345", walletBalance: 600, diariesSold: 12, commissionRate: 50, status: "active" },
  { id: "V013", role: "vendor", name: "Cure & Care", location: "Bangalore", phone: "+91-9876543222", bankDetails: "BOB-XXXX3456", walletBalance: 3700, diariesSold: 55, commissionRate: 50, status: "active" },
  { id: "V014", role: "vendor", name: "Health Hub", location: "Delhi", phone: "+91-9876543223", bankDetails: "KOTAK-XXXX4567", walletBalance: 1500, diariesSold: 30, commissionRate: 50, status: "active" },
  { id: "V015", role: "vendor", name: "MaxCare Pharmacy", location: "Chandigarh", phone: "+91-9876543224", bankDetails: "HDFC-XXXX5678", walletBalance: 500, diariesSold: 10, commissionRate: 50, status: "active" },
  { id: "V016", role: "vendor", name: "Dhanwantari Medical", location: "Lucknow", phone: "+91-9876543225", bankDetails: "SBI-XXXX6789", walletBalance: 2800, diariesSold: 42, commissionRate: 50, status: "active" },
  { id: "V017", role: "vendor", name: "Jan Aushadhi", location: "Patna", phone: "+91-9876543226", bankDetails: "ICICI-XXXX7890", walletBalance: 400, diariesSold: 8, commissionRate: 50, status: "inactive" },
  { id: "V018", role: "vendor", name: "Sri Ram Medicals", location: "Hyderabad", phone: "+91-9876543227", bankDetails: "AXIS-XXXX8901", walletBalance: 7200, diariesSold: 88, commissionRate: 50, status: "active" },
  { id: "V019", role: "vendor", name: "Practo Health", location: "Pune", phone: "+91-9876543228", bankDetails: "PNB-XXXX9012", walletBalance: 1900, diariesSold: 38, commissionRate: 50, status: "active" },
  { id: "V020", role: "vendor", name: "Vaidya Pharmacy", location: "Kochi", phone: "+91-9876543229", bankDetails: "BOB-XXXX0123", walletBalance: 3300, diariesSold: 66, commissionRate: 50, status: "active" },
];

export const patients: Patient[] = [
  { id: "P001", name: "Sunita Devi", age: 45, phone: "+91-9123456789", diaryId: "DRY-2024-001", doctorId: "D001", vendorId: "V001", registeredDate: "2024-01-15", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "critical", treatmentPlan: "Chemotherapy Cycle 3" },
  { id: "P002", name: "Meena Kumari", age: 52, phone: "+91-9123456790", diaryId: "DRY-2024-002", doctorId: "D001", vendorId: "V002", registeredDate: "2024-01-20", status: "active", stage: "Stage 1", lastEntry: "2024-02-09", riskLevel: "normal", treatmentPlan: "Radiation Therapy" },
  { id: "P003", name: "Rekha Singh", age: 38, phone: "+91-9123456791", diaryId: "DRY-2024-003", doctorId: "D001", vendorId: "V001", registeredDate: "2024-01-22", status: "active", stage: "Stage 3", lastEntry: "2024-02-08", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 5" },
  { id: "P004", name: "Kamla Patel", age: 60, phone: "+91-9123456792", diaryId: "DRY-2024-004", doctorId: "D002", vendorId: "V003", registeredDate: "2024-01-25", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Post-Surgery Monitoring" },
  { id: "P005", name: "Anjali Rao", age: 41, phone: "+91-9123456793", diaryId: "DRY-2024-005", doctorId: "D002", vendorId: "V004", registeredDate: "2024-01-28", status: "active", stage: "Stage 1", lastEntry: "2024-02-07", riskLevel: "normal", treatmentPlan: "Hormone Therapy" },
  { id: "P006", name: "Geeta Sharma", age: 55, phone: "+91-9123456794", diaryId: "DRY-2024-006", doctorId: "D003", vendorId: "V005", registeredDate: "2024-02-01", status: "active", stage: "Stage 4", lastEntry: "2024-02-10", riskLevel: "critical", treatmentPlan: "Palliative Care" },
  { id: "P007", name: "Sita Ram", age: 48, phone: "+91-9123456795", diaryId: "DRY-2024-007", doctorId: "D003", vendorId: "V006", registeredDate: "2024-02-03", status: "active", stage: "Stage 2", lastEntry: "2024-02-09", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 2" },
  { id: "P008", name: "Radha Gupta", age: 43, phone: "+91-9123456796", diaryId: "DRY-2024-008", doctorId: "D004", vendorId: "V007", registeredDate: "2024-02-05", status: "active", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Surgery Scheduled" },
  { id: "P009", name: "Parvati Nair", age: 57, phone: "+91-9123456797", diaryId: "DRY-2024-009", doctorId: "D004", vendorId: "V008", registeredDate: "2024-02-06", status: "active", stage: "Stage 3", lastEntry: "2024-02-08", riskLevel: "critical", treatmentPlan: "Chemotherapy Cycle 4" },
  { id: "P010", name: "Lakshmi Iyer", age: 50, phone: "+91-9123456798", diaryId: "DRY-2024-010", doctorId: "D005", vendorId: "V009", registeredDate: "2024-02-07", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "high", treatmentPlan: "Radiation + Chemo" },
  { id: "P011", name: "Asha Banerjee", age: 46, phone: "+91-9123456799", diaryId: "DRY-2024-011", doctorId: "D005", vendorId: "V010", registeredDate: "2024-02-08", status: "active", stage: "Stage 1", lastEntry: "2024-02-09", riskLevel: "normal", treatmentPlan: "Lumpectomy Recovery" },
  { id: "P012", name: "Kavita Joshi", age: 39, phone: "+91-9123456800", diaryId: "DRY-2024-012", doctorId: "D006", vendorId: "V011", registeredDate: "2024-01-10", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Chemotherapy Cycle 1" },
  { id: "P013", name: "Nirmala Reddy", age: 62, phone: "+91-9123456801", diaryId: "DRY-2024-013", doctorId: "D006", vendorId: "V012", registeredDate: "2024-01-12", status: "active", stage: "Stage 3", lastEntry: "2024-02-06", riskLevel: "high", treatmentPlan: "Mastectomy Planned" },
  { id: "P014", name: "Sarita Mishra", age: 44, phone: "+91-9123456802", diaryId: "DRY-2024-014", doctorId: "D008", vendorId: "V013", registeredDate: "2024-01-18", status: "pending", stage: "Stage 1", lastEntry: "2024-02-05", riskLevel: "normal", treatmentPlan: "Diagnostic Phase" },
  { id: "P015", name: "Uma Devi", age: 53, phone: "+91-9123456803", diaryId: "DRY-2024-015", doctorId: "D008", vendorId: "V014", registeredDate: "2024-01-19", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 3" },
  { id: "P016", name: "Padma Acharya", age: 47, phone: "+91-9123456804", diaryId: "DRY-2024-016", doctorId: "D009", vendorId: "V015", registeredDate: "2024-02-02", status: "active", stage: "Stage 4", lastEntry: "2024-02-09", riskLevel: "critical", treatmentPlan: "Targeted Therapy" },
  { id: "P017", name: "Usha Kapoor", age: 56, phone: "+91-9123456805", diaryId: "DRY-2024-017", doctorId: "D010", vendorId: "V016", registeredDate: "2024-01-30", status: "active", stage: "Stage 2", lastEntry: "2024-02-08", riskLevel: "normal", treatmentPlan: "Post-Chemo Monitoring" },
  { id: "P018", name: "Shanti Pillai", age: 49, phone: "+91-9123456806", diaryId: "DRY-2024-018", doctorId: "D010", vendorId: "V018", registeredDate: "2024-02-04", status: "active", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Sentinel Node Biopsy" },
  { id: "P019", name: "Janaki Menon", age: 58, phone: "+91-9123456807", diaryId: "DRY-2024-019", doctorId: "D013", vendorId: "V019", registeredDate: "2024-02-01", status: "active", stage: "Stage 3", lastEntry: "2024-02-07", riskLevel: "high", treatmentPlan: "Neoadjuvant Therapy" },
  { id: "P020", name: "Bharati Das", age: 42, phone: "+91-9123456808", diaryId: "DRY-2024-020", doctorId: "D015", vendorId: "V020", registeredDate: "2024-02-09", status: "pending", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Initial Assessment" },
];

export const diaries: Diary[] = patients.map((p, i) => ({
  id: p.diaryId,
  serialNumber: `DRY2024${String(i + 1).padStart(4, "0")}`,
  status: p.status === "pending" ? "pending" as const : "active" as const,
  patientId: p.id,
  vendorId: p.vendorId,
  doctorId: p.doctorId,
  activationDate: p.registeredDate,
  salePrice: 500,
  vendorCommission: 50,
}));

const symptoms = ["Paracetamol", "Ondansetron", "Tamoxifen", "Letrozole", "Metoclopramide", "Dexamethasone"];
export const diaryEntries: DiaryEntry[] = [];
patients.forEach((p) => {
  const count = p.riskLevel === "critical" ? 5 : p.riskLevel === "high" ? 4 : 3;
  for (let j = 0; j < count; j++) {
    const pain = p.riskLevel === "critical" ? 6 + Math.floor(Math.random() * 4) : p.riskLevel === "high" ? 4 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 4);
    diaryEntries.push({
      id: `DE-${p.id}-${j + 1}`,
      patientId: p.id,
      diaryId: p.diaryId,
      pageNumber: j + 1,
      uploadDate: new Date(2024, 1, 5 + j).toISOString().split("T")[0],
      parsedData: {
        painLevel: pain,
        nausea: pain > 5,
        fever: Math.random() > 0.7,
        appetite: pain > 6 ? "poor" : pain > 3 ? "moderate" : "good",
        sleepQuality: pain > 6 ? "poor" : pain > 3 ? "fair" : "good",
        medications: symptoms.slice(0, 2 + Math.floor(Math.random() * 3)),
      },
      flagged: pain >= 7,
      doctorReviewed: Math.random() > 0.4,
    });
  }
});

export const notifications: Notification[] = [
  { id: "N001", userId: "D001", type: "alert", severity: "high", message: "Patient Sunita Devi reported severe pain (Level 8/10)", patientId: "P001", timestamp: "2024-02-10T08:05:00Z", read: false },
  { id: "N002", userId: "D001", type: "alert", severity: "high", message: "Patient Rekha Singh missed diary entry for 2 days", patientId: "P003", timestamp: "2024-02-10T07:00:00Z", read: false },
  { id: "N003", userId: "D001", type: "info", severity: "medium", message: "New diary entry from Meena Kumari", patientId: "P002", timestamp: "2024-02-09T14:30:00Z", read: true },
  { id: "N004", userId: "D002", type: "alert", severity: "high", message: "Patient Kamla Patel reported fever and nausea", patientId: "P004", timestamp: "2024-02-10T09:15:00Z", read: false },
  { id: "N005", userId: "D003", type: "alert", severity: "high", message: "Critical: Geeta Sharma pain level 9/10", patientId: "P006", timestamp: "2024-02-10T06:30:00Z", read: false },
  { id: "N006", userId: "D004", type: "info", severity: "low", message: "Radha Gupta completed diary page 3", patientId: "P008", timestamp: "2024-02-10T10:00:00Z", read: true },
  { id: "N007", userId: "D004", type: "alert", severity: "high", message: "Critical: Parvati Nair reports difficulty breathing", patientId: "P009", timestamp: "2024-02-08T15:45:00Z", read: false },
  { id: "N008", userId: "SA001", type: "info", severity: "medium", message: "5 new diary activations pending approval", timestamp: "2024-02-10T08:00:00Z", read: false },
  { id: "N009", userId: "SA001", type: "reminder", severity: "low", message: "Monthly vendor payout due in 3 days", timestamp: "2024-02-09T09:00:00Z", read: true },
  { id: "N010", userId: "V001", type: "info", severity: "medium", message: "Diary DRY-2024-001 approved and activated", timestamp: "2024-02-10T11:00:00Z", read: false },
];

export const auditLogs: AuditLog[] = [
  { id: "AL001", timestamp: "2024-02-10T14:32:00Z", userId: "D001", userName: "Dr. Priya Sharma", role: "Doctor", action: "Exported Patient Data", details: "15 records exported", ipAddress: "192.168.1.1" },
  { id: "AL002", timestamp: "2024-02-10T13:15:00Z", userId: "V001", userName: "Rajesh Medical Store", role: "Vendor", action: "Diary Activation", details: "DRY-2024-021 activated", ipAddress: "192.168.1.45" },
  { id: "AL003", timestamp: "2024-02-10T12:00:00Z", userId: "SA001", userName: "Admin User", role: "Super Admin", action: "User Deactivated", details: "Vendor V017 deactivated", ipAddress: "10.0.0.1" },
  { id: "AL004", timestamp: "2024-02-10T11:30:00Z", userId: "D002", userName: "Dr. Rajesh Kumar", role: "Doctor", action: "Patient Registration", details: "New patient registered", ipAddress: "192.168.2.10" },
  { id: "AL005", timestamp: "2024-02-10T10:45:00Z", userId: "A001", userName: "Nurse Sunita", role: "Assistant", action: "Login", details: "Successful login", ipAddress: "192.168.1.100" },
  { id: "AL006", timestamp: "2024-02-09T16:20:00Z", userId: "D003", userName: "Dr. Anita Gupta", role: "Doctor", action: "Diary Entry Reviewed", details: "5 entries reviewed", ipAddress: "172.16.0.5" },
  { id: "AL007", timestamp: "2024-02-09T15:00:00Z", userId: "SA001", userName: "Admin User", role: "Super Admin", action: "Vendor Payout", details: "₹5,000 transferred to V002", ipAddress: "10.0.0.1" },
  { id: "AL008", timestamp: "2024-02-09T14:10:00Z", userId: "V004", userName: "Netmeds Store", role: "Vendor", action: "Diary Activation", details: "DRY-2024-022 activated", ipAddress: "192.168.3.20" },
  { id: "AL009", timestamp: "2024-02-09T11:30:00Z", userId: "D005", userName: "Dr. Meera Patel", role: "Doctor", action: "Broadcast Sent", details: "Message to 8 patients", ipAddress: "192.168.4.15" },
  { id: "AL010", timestamp: "2024-02-08T09:00:00Z", userId: "SA001", userName: "Admin User", role: "Super Admin", action: "Doctor Onboarded", details: "Dr. Deepa Menon added", ipAddress: "10.0.0.1" },
];

export const assistants: Assistant[] = [
  { id: "A001", role: "assistant", name: "Nurse Sunita", email: "sunita@aiims.com", doctorId: "D001", permissions: { viewPatients: true, callPatients: true, exportData: false, sendNotifications: false }, status: "active" },
  { id: "A002", role: "assistant", name: "Nurse Preethi", email: "preethi@aiims.com", doctorId: "D001", permissions: { viewPatients: true, callPatients: true, exportData: true, sendNotifications: true }, status: "active" },
  { id: "A003", role: "assistant", name: "Nurse Lakshmi", email: "lakshmi@tata.com", doctorId: "D002", permissions: { viewPatients: true, callPatients: false, exportData: false, sendNotifications: false }, status: "active" },
];

export const tasks: Task[] = [
  { id: "T001", title: "Call high-risk patients", assignedBy: "Dr. Priya Sharma", priority: "high", dueDate: "2024-02-11", status: "pending", patientIds: ["P001", "P003"] },
  { id: "T002", title: "Review pending diary entries", assignedBy: "Dr. Priya Sharma", priority: "medium", dueDate: "2024-02-12", status: "in_progress", patientIds: ["P002"] },
  { id: "T003", title: "Follow up on missed appointments", assignedBy: "Dr. Priya Sharma", priority: "low", dueDate: "2024-02-13", status: "completed" },
];
