// ---- USERS ----
export interface Doctor {
  id: string; role: "doctor"; name: string; email: string; phone?: string; hospital: string; license: string; licenseRegistration?: string; licensePhoto?: string; specialization: string; status: "active" | "inactive" | "pending";
}
export interface Vendor {
  id: string; role: "vendor"; name: string; email?: string; location: string; phone: string; gst?: string; bankDetails: string; walletBalance: number; diariesSold: number; commissionRate: number; status: "active" | "inactive";
}
export interface Assistant {
  id: string; role: "assistant"; name: string; email: string; doctorId: string; permissions: { viewPatients: boolean; callPatients: boolean; exportData: boolean; sendNotifications: boolean }; status: "active" | "inactive";
}
export interface SuperAdmin {
  id: string; role: "super_admin"; name: string; email: string; phone?: string; createdDate?: string; status?: "active" | "inactive";
}
export type User = Doctor | Vendor | Assistant | SuperAdmin;

export type DiaryType = "peri-operative" | "post-operative" | "follow-up" | "chemotherapy" | "radiology";

export interface Patient {
  id: string; name: string; age: number; gender: string; phone: string; address?: string; diaryId: string; diaryType?: DiaryType; doctorId: string; vendorId: string; registeredDate: string; status: "active" | "pending" | "inactive"; stage: string; lastEntry: string; riskLevel: "normal" | "high" | "critical"; treatmentPlan: string;
}

export interface Diary {
  id: string; serialNumber: string; status: "pending" | "active" | "inactive" | "rejected" | "completed"; patientId: string; vendorId: string; doctorId: string; activationDate: string; salePrice: number; vendorCommission: number; diaryType?: DiaryType;
}

export interface DiaryEntry {
  id: string; patientId: string; diaryId: string; pageNumber: number; uploadDate: string; parsedData: { painLevel: number; nausea: boolean; fever: boolean; appetite: string; sleepQuality: string; medications: string[] }; flagged: boolean; doctorReviewed: boolean;
}

export interface Notification {
  id: string; userId: string; type: "alert" | "info" | "reminder"; severity: "high" | "medium" | "low"; message: string; patientId?: string; timestamp: string; read: boolean;
}

export interface AuditLog {
  id: string; timestamp: string; userId: string; userName: string; role: string; action: string; details: string; ipAddress: string; vendorName?: string; doctorName?: string;
}

export interface Task {
  id: string; title: string; assignedBy: string; priority: "high" | "medium" | "low"; dueDate: string; status: "pending" | "in_progress" | "completed"; patientIds?: string[];
}

export type InventoryDiaryStatus = "unassigned" | "assigned" | "active" | "inactive";
export type DiaryTypeCode = "PO" | "OP" | "FU" | "CH" | "RA";

export interface GeneratedDiary {
  id: string;
  type: DiaryType;
  typeCode: DiaryTypeCode;
  generatedDate: string;
  status: InventoryDiaryStatus;
  assignedVendorId?: string;
  patientName?: string;
}

export interface DiaryRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  type: DiaryType;
  quantity: number;
  message?: string;
  requestDate: string;
  status: "pending" | "fulfilled" | "rejected";
  fulfilledDate?: string;
  assignedDiaryIds?: string[];
}

// ---- MOCK DATA ----
export const superAdmins: SuperAdmin[] = [
  { id: "SA001", role: "super_admin", name: "Admin User", email: "admin@oneheal.com", phone: "+91-9000000001", createdDate: "2023-06-01", status: "active" },
  { id: "SA002", role: "super_admin", name: "Ravi Verma", email: "ravi@oneheal.com", phone: "+91-9000000002", createdDate: "2023-08-15", status: "active" },
];

export const doctors: Doctor[] = [
  { id: "D001", role: "doctor", name: "Dr. Priya Sharma", email: "priya.sharma@aiims.com", phone: "+91-9876000001", hospital: "AIIMS Delhi", license: "MCI-DL-12345", licenseRegistration: "REG-DL-001", specialization: "Oncology", status: "active" },
  { id: "D002", role: "doctor", name: "Dr. Rajesh Kumar", email: "rajesh.k@tata.com", phone: "+91-9876000002", hospital: "Tata Memorial", license: "MCI-MH-23456", licenseRegistration: "REG-MH-002", specialization: "Surgery", status: "active" },
  { id: "D003", role: "doctor", name: "Dr. Anita Gupta", email: "anita.g@apollo.com", phone: "+91-9876000003", hospital: "Apollo Chennai", license: "MCI-TN-34567", licenseRegistration: "REG-TN-003", specialization: "Radiotherapy", status: "active" },
  { id: "D004", role: "doctor", name: "Dr. Vikram Singh", email: "vikram.s@fortis.com", phone: "+91-9876000004", hospital: "Fortis Gurgaon", license: "MCI-HR-45678", licenseRegistration: "REG-HR-004", specialization: "Oncology", status: "active" },
  { id: "D005", role: "doctor", name: "Dr. Meera Patel", email: "meera.p@apollo.com", phone: "+91-9876000005", hospital: "Apollo Mumbai", license: "MCI-MH-56789", licenseRegistration: "REG-MH-005", specialization: "Surgery", status: "active" },
  { id: "D006", role: "doctor", name: "Dr. Suresh Nair", email: "suresh.n@amrita.com", phone: "+91-9876000006", hospital: "Amrita Kochi", license: "MCI-KL-67890", licenseRegistration: "REG-KL-006", specialization: "Oncology", status: "active" },
  { id: "D007", role: "doctor", name: "Dr. Kavitha Reddy", email: "kavitha.r@nims.com", phone: "+91-9876000007", hospital: "NIMS Hyderabad", license: "MCI-TS-78901", licenseRegistration: "REG-TS-007", specialization: "Radiotherapy", status: "inactive" },
  { id: "D008", role: "doctor", name: "Dr. Arun Joshi", email: "arun.j@sms.com", phone: "+91-9876000008", hospital: "SMS Hospital Jaipur", license: "MCI-RJ-89012", licenseRegistration: "REG-RJ-008", specialization: "Oncology", status: "active" },
  { id: "D009", role: "doctor", name: "Dr. Sneha Kapoor", email: "sneha.k@medanta.com", phone: "+91-9876000009", hospital: "Medanta Gurgaon", license: "MCI-HR-90123", licenseRegistration: "REG-HR-009", specialization: "Surgery", status: "active" },
  { id: "D010", role: "doctor", name: "Dr. Ramesh Iyer", email: "ramesh.i@cmc.com", phone: "+91-9876000010", hospital: "CMC Vellore", license: "MCI-TN-01234", licenseRegistration: "REG-TN-010", specialization: "Oncology", status: "active" },
  { id: "D011", role: "doctor", name: "Dr. Pooja Malhotra", email: "pooja.m@max.com", phone: "+91-9876000011", hospital: "Max Delhi", license: "MCI-DL-11234", licenseRegistration: "REG-DL-011", specialization: "Surgery", status: "active" },
  { id: "D012", role: "doctor", name: "Dr. Ashok Banerjee", email: "ashok.b@cmri.com", phone: "+91-9876000012", hospital: "CMRI Kolkata", license: "MCI-WB-22345", licenseRegistration: "REG-WB-012", specialization: "Radiotherapy", status: "active" },
  { id: "D013", role: "doctor", name: "Dr. Lakshmi Rao", email: "lakshmi.r@kidwai.com", phone: "+91-9876000013", hospital: "Kidwai Bangalore", license: "MCI-KA-33456", licenseRegistration: "REG-KA-013", specialization: "Oncology", status: "active" },
  { id: "D014", role: "doctor", name: "Dr. Nikhil Chopra", email: "nikhil.c@pgimer.com", phone: "+91-9876000014", hospital: "PGIMER Chandigarh", license: "MCI-CH-44567", licenseRegistration: "REG-CH-014", specialization: "Surgery", status: "active" },
  { id: "D015", role: "doctor", name: "Dr. Deepa Menon", email: "deepa.m@rcc.com", phone: "+91-9876000015", hospital: "RCC Trivandrum", license: "MCI-KL-55678", licenseRegistration: "REG-KL-015", specialization: "Oncology", status: "active" },
];

export const vendors: Vendor[] = [
  { id: "V001", role: "vendor", name: "Rajesh Medical Store", email: "rajesh@medical.com", location: "Delhi", phone: "+91-9876543210", gst: "07AAACR1234A1Z5", bankDetails: "HDFC-XXXX1234", walletBalance: 2500, diariesSold: 50, commissionRate: 50, status: "active" },
  { id: "V002", role: "vendor", name: "MedPlus Pharmacy", email: "medplus@pharma.com", location: "Mumbai", phone: "+91-9876543211", gst: "27AABCM5678B2Z3", bankDetails: "ICICI-XXXX2345", walletBalance: 4200, diariesSold: 84, commissionRate: 50, status: "active" },
  { id: "V003", role: "vendor", name: "Apollo Pharmacy", email: "apollo@pharma.com", location: "Chennai", phone: "+91-9876543212", gst: "33AADCA9012C3Z1", bankDetails: "SBI-XXXX3456", walletBalance: 1800, diariesSold: 36, commissionRate: 50, status: "active" },
  { id: "V004", role: "vendor", name: "Netmeds Store", email: "netmeds@store.com", location: "Bangalore", phone: "+91-9876543213", gst: "29AABCN3456D4Z9", bankDetails: "AXIS-XXXX4567", walletBalance: 6500, diariesSold: 100, commissionRate: 50, status: "active" },
  { id: "V005", role: "vendor", name: "HealthKart", email: "healthkart@hk.com", location: "Kolkata", phone: "+91-9876543214", gst: "19AADCH7890E5Z7", bankDetails: "PNB-XXXX5678", walletBalance: 950, diariesSold: 19, commissionRate: 50, status: "active" },
  { id: "V006", role: "vendor", name: "PharmEasy Delhi", email: "pharmeasy@pe.com", location: "Delhi", phone: "+91-9876543215", gst: "07AABCP1234F6Z5", bankDetails: "BOB-XXXX6789", walletBalance: 3100, diariesSold: 62, commissionRate: 50, status: "active" },
  { id: "V007", role: "vendor", name: "MedLife Stores", email: "medlife@ml.com", location: "Hyderabad", phone: "+91-9876543216", gst: "36AADCM5678G7Z3", bankDetails: "KOTAK-XXXX7890", walletBalance: 750, diariesSold: 15, commissionRate: 50, status: "active" },
  { id: "V008", role: "vendor", name: "Wellness Forever", email: "wellness@wf.com", location: "Pune", phone: "+91-9876543217", gst: "27AABCW9012H8Z1", bankDetails: "HDFC-XXXX8901", walletBalance: 5400, diariesSold: 78, commissionRate: 50, status: "active" },
  { id: "V009", role: "vendor", name: "Guardian Pharmacy", email: "guardian@gp.com", location: "Chennai", phone: "+91-9876543218", gst: "33AADCG3456I9Z9", bankDetails: "ICICI-XXXX9012", walletBalance: 2200, diariesSold: 44, commissionRate: 50, status: "active" },
  { id: "V010", role: "vendor", name: "Sanjivani Medical", email: "sanjivani@sm.com", location: "Jaipur", phone: "+91-9876543219", gst: "08AABCS7890J0Z7", bankDetails: "SBI-XXXX0123", walletBalance: 1100, diariesSold: 22, commissionRate: 50, status: "active" },
  { id: "V011", role: "vendor", name: "City Chemist", email: "city@chemist.com", location: "Mumbai", phone: "+91-9876543220", gst: "27AADCC1234K1Z5", bankDetails: "AXIS-XXXX1234", walletBalance: 8900, diariesSold: 95, commissionRate: 50, status: "active" },
  { id: "V012", role: "vendor", name: "Lifeline Pharma", email: "lifeline@lp.com", location: "Kolkata", phone: "+91-9876543221", gst: "19AABCL5678L2Z3", bankDetails: "PNB-XXXX2345", walletBalance: 600, diariesSold: 12, commissionRate: 50, status: "active" },
  { id: "V013", role: "vendor", name: "Cure & Care", email: "cure@care.com", location: "Bangalore", phone: "+91-9876543222", gst: "29AADCC9012M3Z1", bankDetails: "BOB-XXXX3456", walletBalance: 3700, diariesSold: 55, commissionRate: 50, status: "active" },
  { id: "V014", role: "vendor", name: "Health Hub", email: "health@hub.com", location: "Delhi", phone: "+91-9876543223", gst: "07AABCH3456N4Z9", bankDetails: "KOTAK-XXXX4567", walletBalance: 1500, diariesSold: 30, commissionRate: 50, status: "active" },
  { id: "V015", role: "vendor", name: "MaxCare Pharmacy", email: "maxcare@mc.com", location: "Chandigarh", phone: "+91-9876543224", gst: "04AADCM7890O5Z7", bankDetails: "HDFC-XXXX5678", walletBalance: 500, diariesSold: 10, commissionRate: 50, status: "active" },
  { id: "V016", role: "vendor", name: "Dhanwantari Medical", email: "dhanwantari@dm.com", location: "Lucknow", phone: "+91-9876543225", gst: "09AABCD1234P6Z5", bankDetails: "SBI-XXXX6789", walletBalance: 2800, diariesSold: 42, commissionRate: 50, status: "active" },
  { id: "V017", role: "vendor", name: "Jan Aushadhi", email: "jan@aushadhi.com", location: "Patna", phone: "+91-9876543226", gst: "10AADCJ5678Q7Z3", bankDetails: "ICICI-XXXX7890", walletBalance: 400, diariesSold: 8, commissionRate: 50, status: "inactive" },
  { id: "V018", role: "vendor", name: "Sri Ram Medicals", email: "sriram@med.com", location: "Hyderabad", phone: "+91-9876543227", gst: "36AABCS9012R8Z1", bankDetails: "AXIS-XXXX8901", walletBalance: 7200, diariesSold: 88, commissionRate: 50, status: "active" },
  { id: "V019", role: "vendor", name: "Practo Health", email: "practo@health.com", location: "Pune", phone: "+91-9876543228", gst: "27AADCP3456S9Z9", bankDetails: "PNB-XXXX9012", walletBalance: 1900, diariesSold: 38, commissionRate: 50, status: "active" },
  { id: "V020", role: "vendor", name: "Vaidya Pharmacy", email: "vaidya@pharma.com", location: "Kochi", phone: "+91-9876543229", gst: "32AABCV7890T0Z7", bankDetails: "BOB-XXXX0123", walletBalance: 3300, diariesSold: 66, commissionRate: 50, status: "active" },
];

const diaryTypes: DiaryType[] = ["peri-operative", "post-operative", "follow-up", "chemotherapy", "radiology"];
const genders = ["Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female"];

export const patients: Patient[] = [
  { id: "P001", name: "Sunita Devi", age: 45, gender: "Female", phone: "+91-9123456789", address: "B-12, Saket, New Delhi", diaryId: "DRY-2024-001", diaryType: "chemotherapy", doctorId: "D001", vendorId: "V001", registeredDate: "2024-01-15", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "critical", treatmentPlan: "Chemotherapy Cycle 3" },
  { id: "P002", name: "Meena Kumari", age: 52, gender: "Female", phone: "+91-9123456790", address: "14, MG Road, Mumbai", diaryId: "DRY-2024-002", diaryType: "radiology", doctorId: "D001", vendorId: "V002", registeredDate: "2024-01-20", status: "active", stage: "Stage 1", lastEntry: "2024-02-09", riskLevel: "normal", treatmentPlan: "Radiation Therapy" },
  { id: "P003", name: "Rekha Singh", age: 38, gender: "Female", phone: "+91-9123456791", address: "45, Lajpat Nagar, Delhi", diaryId: "DRY-2024-003", diaryType: "chemotherapy", doctorId: "D001", vendorId: "V001", registeredDate: "2024-01-22", status: "active", stage: "Stage 3", lastEntry: "2024-02-08", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 5" },
  { id: "P004", name: "Kamla Patel", age: 60, gender: "Female", phone: "+91-9123456792", address: "78, Anna Nagar, Chennai", diaryId: "DRY-2024-004", diaryType: "post-operative", doctorId: "D002", vendorId: "V003", registeredDate: "2024-01-25", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Post-Surgery Monitoring" },
  { id: "P005", name: "Anjali Rao", age: 41, gender: "Female", phone: "+91-9123456793", address: "23, Koramangala, Bangalore", diaryId: "DRY-2024-005", diaryType: "follow-up", doctorId: "D002", vendorId: "V004", registeredDate: "2024-01-28", status: "active", stage: "Stage 1", lastEntry: "2024-02-07", riskLevel: "normal", treatmentPlan: "Hormone Therapy" },
  { id: "P006", name: "Geeta Sharma", age: 55, gender: "Female", phone: "+91-9123456794", address: "56, Salt Lake, Kolkata", diaryId: "DRY-2024-006", diaryType: "follow-up", doctorId: "D003", vendorId: "V005", registeredDate: "2024-02-01", status: "active", stage: "Stage 4", lastEntry: "2024-02-10", riskLevel: "critical", treatmentPlan: "Palliative Care" },
  { id: "P007", name: "Sita Ram", age: 48, gender: "Female", phone: "+91-9123456795", address: "90, Hauz Khas, Delhi", diaryId: "DRY-2024-007", diaryType: "chemotherapy", doctorId: "D003", vendorId: "V006", registeredDate: "2024-02-03", status: "active", stage: "Stage 2", lastEntry: "2024-02-09", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 2" },
  { id: "P008", name: "Radha Gupta", age: 43, gender: "Female", phone: "+91-9123456796", address: "34, Sector 15, Gurgaon", diaryId: "DRY-2024-008", diaryType: "peri-operative", doctorId: "D004", vendorId: "V007", registeredDate: "2024-02-05", status: "active", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Surgery Scheduled" },
  { id: "P009", name: "Parvati Nair", age: 57, gender: "Female", phone: "+91-9123456797", address: "67, Ernakulam, Kochi", diaryId: "DRY-2024-009", diaryType: "chemotherapy", doctorId: "D004", vendorId: "V008", registeredDate: "2024-02-06", status: "active", stage: "Stage 3", lastEntry: "2024-02-08", riskLevel: "critical", treatmentPlan: "Chemotherapy Cycle 4" },
  { id: "P010", name: "Lakshmi Iyer", age: 50, gender: "Female", phone: "+91-9123456798", address: "12, T Nagar, Chennai", diaryId: "DRY-2024-010", diaryType: "radiology", doctorId: "D005", vendorId: "V009", registeredDate: "2024-02-07", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "high", treatmentPlan: "Radiation + Chemo" },
  { id: "P011", name: "Asha Banerjee", age: 46, gender: "Female", phone: "+91-9123456799", address: "89, Park Street, Kolkata", diaryId: "DRY-2024-011", diaryType: "post-operative", doctorId: "D005", vendorId: "V010", registeredDate: "2024-02-08", status: "active", stage: "Stage 1", lastEntry: "2024-02-09", riskLevel: "normal", treatmentPlan: "Lumpectomy Recovery" },
  { id: "P012", name: "Kavita Joshi", age: 39, gender: "Female", phone: "+91-9123456800", address: "45, Banjara Hills, Hyderabad", diaryId: "DRY-2024-012", diaryType: "chemotherapy", doctorId: "D006", vendorId: "V011", registeredDate: "2024-01-10", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Chemotherapy Cycle 1" },
  { id: "P013", name: "Nirmala Reddy", age: 62, gender: "Female", phone: "+91-9123456801", address: "23, Jubilee Hills, Hyderabad", diaryId: "DRY-2024-013", diaryType: "peri-operative", doctorId: "D006", vendorId: "V012", registeredDate: "2024-01-12", status: "active", stage: "Stage 3", lastEntry: "2024-02-06", riskLevel: "high", treatmentPlan: "Mastectomy Planned" },
  { id: "P014", name: "Sarita Mishra", age: 44, gender: "Female", phone: "+91-9123456802", address: "78, MI Road, Jaipur", diaryId: "DRY-2024-014", diaryType: "follow-up", doctorId: "D008", vendorId: "V013", registeredDate: "2024-01-18", status: "pending", stage: "Stage 1", lastEntry: "2024-02-05", riskLevel: "normal", treatmentPlan: "Diagnostic Phase" },
  { id: "P015", name: "Uma Devi", age: 53, gender: "Female", phone: "+91-9123456803", address: "34, Civil Lines, Jaipur", diaryId: "DRY-2024-015", diaryType: "chemotherapy", doctorId: "D008", vendorId: "V014", registeredDate: "2024-01-19", status: "active", stage: "Stage 2", lastEntry: "2024-02-10", riskLevel: "high", treatmentPlan: "Chemotherapy Cycle 3" },
  { id: "P016", name: "Padma Acharya", age: 47, gender: "Female", phone: "+91-9123456804", address: "56, Sector 17, Chandigarh", diaryId: "DRY-2024-016", diaryType: "follow-up", doctorId: "D009", vendorId: "V015", registeredDate: "2024-02-02", status: "active", stage: "Stage 4", lastEntry: "2024-02-09", riskLevel: "critical", treatmentPlan: "Targeted Therapy" },
  { id: "P017", name: "Usha Kapoor", age: 56, gender: "Female", phone: "+91-9123456805", address: "90, Gomti Nagar, Lucknow", diaryId: "DRY-2024-017", diaryType: "post-operative", doctorId: "D010", vendorId: "V016", registeredDate: "2024-01-30", status: "active", stage: "Stage 2", lastEntry: "2024-02-08", riskLevel: "normal", treatmentPlan: "Post-Chemo Monitoring" },
  { id: "P018", name: "Shanti Pillai", age: 49, gender: "Female", phone: "+91-9123456806", address: "12, Besant Nagar, Chennai", diaryId: "DRY-2024-018", diaryType: "peri-operative", doctorId: "D010", vendorId: "V018", registeredDate: "2024-02-04", status: "active", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Sentinel Node Biopsy" },
  { id: "P019", name: "Janaki Menon", age: 58, gender: "Female", phone: "+91-9123456807", address: "67, Indiranagar, Bangalore", diaryId: "DRY-2024-019", diaryType: "chemotherapy", doctorId: "D013", vendorId: "V019", registeredDate: "2024-02-01", status: "active", stage: "Stage 3", lastEntry: "2024-02-07", riskLevel: "high", treatmentPlan: "Neoadjuvant Therapy" },
  { id: "P020", name: "Bharati Das", age: 42, gender: "Female", phone: "+91-9123456808", address: "34, Alipore, Kolkata", diaryId: "DRY-2024-020", diaryType: "radiology", doctorId: "D015", vendorId: "V020", registeredDate: "2024-02-09", status: "pending", stage: "Stage 1", lastEntry: "2024-02-10", riskLevel: "normal", treatmentPlan: "Initial Assessment" },
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
  diaryType: p.diaryType,
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
  // Super Admin notifications - only diary approvals and payouts
  { id: "N008", userId: "SA001", type: "info", severity: "medium", message: "🔔 New diary activation pending approval - DRY-2024-014", timestamp: "2024-02-10T08:00:00Z", read: false },
  { id: "N009", userId: "SA001", type: "reminder", severity: "medium", message: "💰 Vendor payout pending - Rajesh Medical (₹2,500)", timestamp: "2024-02-09T09:00:00Z", read: false },
  { id: "N010", userId: "SA001", type: "info", severity: "medium", message: "🔔 New diary activation pending approval - DRY-2024-020", timestamp: "2024-02-10T11:00:00Z", read: false },
  { id: "N011", userId: "V001", type: "info", severity: "medium", message: "Diary DRY-2024-001 approved and activated", timestamp: "2024-02-10T11:00:00Z", read: false },
];

export const auditLogs: AuditLog[] = [
  { id: "AL001", timestamp: "2024-02-12T14:30:00Z", userId: "V001", userName: "Rajesh Medical Store", role: "Vendor", action: "Patient Registration", details: "P001 - Sunita Devi", ipAddress: "192.168.1.45", vendorName: "Rajesh Medical", doctorName: "Dr. Sharma" },
  { id: "AL002", timestamp: "2024-02-12T13:15:00Z", userId: "D001", userName: "Dr. Priya Sharma", role: "Doctor", action: "Diary Entry Reviewed", details: "Entry DE-P001-3", ipAddress: "103.25.10.8", doctorName: "Dr. Priya" },
  { id: "AL003", timestamp: "2024-02-12T12:00:00Z", userId: "V004", userName: "Netmeds Store", role: "Vendor", action: "Diary Activated", details: "DRY-2024-089", ipAddress: "49.36.212.1", vendorName: "Netmeds Store" },
  { id: "AL004", timestamp: "2024-02-11T11:30:00Z", userId: "D002", userName: "Dr. Rajesh Kumar", role: "Doctor", action: "Patient Registration", details: "New patient registered", ipAddress: "192.168.2.10", doctorName: "Dr. Rajesh Kumar" },
  { id: "AL005", timestamp: "2024-02-11T10:45:00Z", userId: "A001", userName: "Nurse Sunita", role: "Assistant", action: "Login", details: "Successful login", ipAddress: "192.168.1.100" },
  { id: "AL006", timestamp: "2024-02-10T16:20:00Z", userId: "D003", userName: "Dr. Anita Gupta", role: "Doctor", action: "Diary Entry Reviewed", details: "5 entries reviewed", ipAddress: "172.16.0.5", doctorName: "Dr. Anita Gupta" },
  { id: "AL007", timestamp: "2024-02-10T15:00:00Z", userId: "SA001", userName: "Admin User", role: "Super Admin", action: "Commission Paid", details: "₹5,000 transferred to V002", ipAddress: "10.0.0.1" },
  { id: "AL008", timestamp: "2024-02-10T14:10:00Z", userId: "V004", userName: "Netmeds Store", role: "Vendor", action: "Diary Activated", details: "DRY-2024-022 activated", ipAddress: "192.168.3.20", vendorName: "Netmeds Store" },
  { id: "AL009", timestamp: "2024-02-10T11:30:00Z", userId: "D005", userName: "Dr. Meera Patel", role: "Doctor", action: "Notification Sent", details: "Message to 8 patients", ipAddress: "192.168.4.15", doctorName: "Dr. Meera Patel" },
  { id: "AL010", timestamp: "2024-02-09T09:00:00Z", userId: "SA001", userName: "Admin User", role: "Super Admin", action: "Payment Received", details: "₹10,000 from diary sales", ipAddress: "10.0.0.1" },
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
