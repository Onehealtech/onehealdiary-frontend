import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, BookOpen, Activity, Search, Phone, Eye, EyeOff, ArrowLeft,
  Send, Plus, Settings, Download, Bell, FileText,
  ClipboardCheck, CheckCircle2, Trash2,
  Image, FileDown, Loader2, UserCircle, Lock,
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const navItems = [
  { label: "Dashboard", path: "/doctor", icon: Activity },
  { label: "Diary Entries", path: "/doctor/diary-entries", icon: BookOpen },
  { label: "Assistant Management", path: "/doctor/assistants", icon: Settings },
  { label: "Task Assignment", path: "/doctor/tasks", icon: ClipboardCheck },
  { label: "Notifications", path: "/doctor/notifications", icon: Bell },
  { label: "Reports", path: "/doctor/reports", icon: FileText },
  { label: "Profile", path: "/doctor/profile", icon: UserCircle },
];

const taskTypeOptions = [
  { value: "review-entries", label: "Review Diary Entries" },
  { value: "call-patients", label: "Call Patients" },
  { value: "send-reminders", label: "Send Reminders" },
  { value: "follow-up", label: "Follow-up" },
  { value: "export-data", label: "Export Data" },
  { value: "other", label: "Other" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "text-blue-500", icon: "🔵" },
  { value: "medium", label: "Medium", color: "text-yellow-500", icon: "🟡" },
  { value: "high", label: "High", color: "text-orange-500", icon: "🟠" },
  { value: "urgent", label: "Urgent", color: "text-red-500", icon: "🔴" },
];

// --- Normalize API responses to frontend-compatible format ---
const mapPatient = (p: any) => ({
  id: p.id,
  name: p.fullName || p.name || "—",
  age: p.age ?? "—",
  gender: p.gender || "—",
  phone: p.phone || p.phoneNumber || "—",
  address: p.address || "",
  diaryId: p.diaryId || "—",
  diaryType: p.diaryType || undefined,
  doctorId: p.doctorId || "",
  vendorId: p.vendorId || "",
  registeredDate: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "—",
  status: "active" as const,
  stage: p.stage || "—",
  lastEntry: "—",
  treatmentPlan: p.treatmentPlan || "—",
  prescribedTests: p.prescribedTests || [],
  testCompletionPercentage: p.testCompletionPercentage || 0,
});

const mapEntry = (e: any, idx: number) => ({
  id: e.id,
  patientId: e.patientId,
  diaryId: e.pageId || "—",
  pageNumber: idx + 1,
  uploadDate: e.scannedAt ? new Date(e.scannedAt).toISOString().split("T")[0] : e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "—",
  parsedData: {
    painLevel: e.scanData?.painLevel ?? 0,
    nausea: e.scanData?.nausea ?? false,
    fever: e.scanData?.fever ?? false,
    appetite: e.scanData?.appetite ?? "—",
    sleepQuality: e.scanData?.sleepQuality ?? "—",
    medications: e.scanData?.medications ?? [],
  },
  flagged: e.flagged ?? false,
  doctorReviewed: e.doctorReviewed ?? false,
  pageType: e.pageType || "—",
  imageUrl: e.imageUrl,
  patient: e.patient,
});

const mapAssistant = (a: any) => ({
  id: a.id,
  role: "assistant" as const,
  name: a.fullName || a.name || "—",
  email: a.email || "—",
  phone: a.phone || "",
  doctorId: a.parentId || "",
  permissions: { viewPatients: true, callPatients: true, exportData: false, sendNotifications: false },
  status: (a.isEmailVerified !== false ? "active" : "inactive") as "active" | "inactive",
});

const mapTask = (t: any) => ({
  id: t.id,
  title: t.title || "—",
  description: t.description,
  taskType: t.taskType || "other",
  assignedTo: t.assignedTo || "",
  assignedBy: t.creator?.fullName || "—",
  priority: t.priority || "medium",
  dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "—",
  status: t.status || "pending",
  patientIds: t.relatedPatientIds || [],
  completedDate: t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : undefined,
  createdDate: t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "—",
  assigneeName: t.assignee?.fullName,
});

export default function DoctorDashboard() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  // ---- API data state ----
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [myAssistants, setMyAssistants] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [apiNotifications, setApiNotifications] = useState<any[]>([]);
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [patientEntries, setPatientEntries] = useState<any[]>([]);
  const [photoHistory, setPhotoHistory] = useState<any[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ id?: string; fileName: string; imagePath?: string; url?: string; imageUrl?: string; createdAt?: string } | null>(null);

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [addAssistantOpen, setAddAssistantOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRecipient, setNotifRecipient] = useState("");
  const [bulkFilter, setBulkFilter] = useState<string | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskType, setTaskType] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPatients, setTaskPatients] = useState<string[]>([]);

  // Reports state
  const [reportPatient, setReportPatient] = useState("");
  const [reportExportType, setReportExportType] = useState<"data" | "photos">("data");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [reportIncludes, setReportIncludes] = useState({ demographics: true, treatment: true, entries: true, symptoms: true, medications: true, appointments: true });
  const [selectedPhotoPages, setSelectedPhotoPages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState(user?.fullName || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Photo export state (for Reports page)
  const [reportPhotoHistory, setReportPhotoHistory] = useState<{ id?: string; fileName: string; imagePath?: string; createdAt?: string }[]>([]);
  const [reportPhotoLoading, setReportPhotoLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Clear selected patient when navigating away from the root doctor page
  useEffect(() => {
    if (currentPage !== "/doctor" && currentPage !== "/doctor/") {
      setSelectedPatientId(null);
    }
  }, [currentPage]);

  // ==================== DATA FETCHING ====================

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/dashboard/doctor`, authHeaders());
        setDashboardStats(res.data.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/dashboard/patients?limit=200`, authHeaders());
        const data = res.data.data?.patients || res.data.data || [];
        setMyPatients(data.map(mapPatient));
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch diary entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/diary-entries/?limit=200`, authHeaders());
        const entries = res.data.data?.entries || res.data.data || [];
        setAllEntries(entries.map((e: any, i: number) => mapEntry(e, i)));
      } catch (err) {
        console.error("Error fetching diary entries:", err);
      }
    };
    fetchEntries();
  }, []);

  // Fetch assistants
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/assistants/?limit=100`, authHeaders());
        const data = res.data.data?.assistants || res.data.data || [];
        setMyAssistants(Array.isArray(data) ? data.map(mapAssistant) : []);
      } catch (err) {
        console.error("Error fetching assistants:", err);
      }
    };
    fetchAssistants();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/tasks/?limit=100`, authHeaders());
        const data = res.data.data?.data || res.data.data || [];
        setTasks(Array.isArray(data) ? data.map(mapTask) : []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };
    fetchTasks();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/notifications/?limit=50`, authHeaders());
        const data = res.data.data?.notifications || res.data.data || [];
        setApiNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  // Fetch exports
  useEffect(() => {
    const fetchExports = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/reports/exports?limit=20`, authHeaders());
        const data = res.data.data?.exports || res.data.data || [];
        setRecentExports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching exports:", err);
      }
    };
    fetchExports();
  }, []);

  // Fetch patient detail + diary entries + photo history when a patient is selected
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientEntries([]);
      setPhotoHistory([]);
      return;
    }
    const fetchDetail = async () => {
      const diaryId = myPatients.find(p => p.id === selectedPatientId)?.diaryId;

      // Fetch each resource independently so one failure doesn't block the others
      const [pRes, eRes, imgRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/v1/patient/${selectedPatientId}`, authHeaders()),
        axios.get(`${BASE_URL}/api/v1/diary-entries/?patientId=${selectedPatientId}&limit=100`, authHeaders()),
        diaryId && diaryId !== "—"
          ? axios.get(`${BASE_URL}/api/v1/upload/image-history/${diaryId}`, authHeaders())
          : Promise.reject("no-diary-id"),
      ]);

      // Patient detail
      if (pRes.status === "fulfilled") {
        const patient = pRes.value.data.data || pRes.value.data;
        setMyPatients(prev => prev.map(p => p.id === selectedPatientId ? mapPatient(patient) : p));
      } else {
        console.error("Error fetching patient detail:", pRes.reason);
      }

      // Diary entries
      if (eRes.status === "fulfilled") {
        const entries = eRes.value.data.data?.entries || eRes.value.data.data || [];
        setPatientEntries(entries.map((e: any, i: number) => mapEntry(e, i)));
      } else {
        console.error("Error fetching diary entries:", eRes.reason);
        setPatientEntries(allEntries.filter(e => e.patientId === selectedPatientId));
      }

      // Photo history
      if (imgRes.status === "fulfilled") {
        setPhotoHistory(imgRes.value.data.data || []);
      } else if (imgRes.reason !== "no-diary-id") {
        console.error("Error fetching photo history:", imgRes.reason);
      }
    };
    fetchDetail();
  }, [selectedPatientId]);

  // Fetch uploaded photos for the selected report patient
  useEffect(() => {
    if (!reportPatient) { setReportPhotoHistory([]); setSelectedPhotoIds([]); return; }
    const patient = myPatients.find(p => p.id === reportPatient);
    const diaryId = patient?.diaryId;
    if (!diaryId || diaryId === "—") { setReportPhotoHistory([]); return; }
    setReportPhotoLoading(true);
    axios.get(`${BASE_URL}/api/v1/upload/image-history/${diaryId}`, authHeaders())
      .then(res => setReportPhotoHistory(res.data.data || []))
      .catch(() => setReportPhotoHistory([]))
      .finally(() => setReportPhotoLoading(false));
    setSelectedPhotoIds([]);
  }, [reportPatient, myPatients]);

  // ==================== HANDLERS ====================

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) return;
    setProfileLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/v1/user/profile`, { fullName: profileName, phone: profilePhone || undefined }, authHeaders());
      login({ ...user!, fullName: profileName });
      toast({ title: "Profile updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must be the same.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/v1/auth/change-password`, { currentPassword, newPassword }, authHeaders());
      toast({ title: "Password changed successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to change password.", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportPhotosPDF = async () => {
    const photos = reportPhotoHistory.filter(p => selectedPhotoIds.includes(p.id || p.fileName));
    if (photos.length === 0) return;
    setExportingPdf(true);
    const patientName = myPatients.find(p => p.id === reportPatient)?.name || "Patient";
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const imgUrl = `${BASE_URL}/uploads/${photo.fileName}`;
        try {
          const response = await fetch(imgUrl, { mode: "cors" });
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (i > 0) pdf.addPage();
          pdf.setFontSize(13);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${patientName} — Diary Photo`, 10, 14);
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`Photo ${i + 1} of ${photos.length}  ·  ${photo.createdAt ? new Date(photo.createdAt).toLocaleDateString("en-IN") : photo.fileName}`, 10, 21);
          pdf.setTextColor(0, 0, 0);
          pdf.addImage(dataUrl, "JPEG", 10, 27, 190, 245);
        } catch {
          if (i > 0) pdf.addPage();
          pdf.setFontSize(11);
          pdf.text(`Image not available: ${photo.fileName}`, 10, 140);
        }
      }
      pdf.save(`diary-photos-${patientName.replace(/\s+/g, "-")}.pdf`);
      toast({ title: `PDF downloaded with ${photos.length} photo(s)!` });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PDF. Ensure images are accessible.", variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAddAssistant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await axios.post(`${BASE_URL}/api/v1/doctor/create-assistant`, {
        fullName: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: (fd.get("phone") as string) || undefined,
      }, authHeaders());
      toast({ title: "Assistant created! Credentials sent to email." });
      setAddAssistantOpen(false);
      // Refresh assistants
      const res = await axios.get(`${BASE_URL}/api/v1/assistants/?limit=100`, authHeaders());
      const data = res.data.data?.assistants || res.data.data || [];
      setMyAssistants(Array.isArray(data) ? data.map(mapAssistant) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create assistant", variant: "destructive" });
    }
  };

  const resetTaskForm = () => {
    setTaskTitle(""); setTaskDesc(""); setTaskType(""); setTaskAssignee(""); setTaskPriority("medium"); setTaskDueDate(""); setTaskPatients([]);
  };

  const handleCreateTask = async () => {
    if (!taskTitle || !taskType || !taskAssignee || !taskDueDate) return;
    try {
      await axios.post(`${BASE_URL}/api/v1/tasks/`, {
        title: taskTitle,
        description: taskDesc || undefined,
        taskType: taskType,
        assignedTo: taskAssignee,
        priority: taskPriority,
        dueDate: taskDueDate,
        relatedPatients: taskPatients.length > 0 ? taskPatients : undefined,
      }, authHeaders());
      toast({ title: "Task assigned successfully!" });
      resetTaskForm();
      // Refresh tasks
      const res = await axios.get(`${BASE_URL}/api/v1/tasks/?limit=100`, authHeaders());
      const data = res.data.data?.data || res.data.data || [];
      setTasks(Array.isArray(data) ? data.map(mapTask) : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create task", variant: "destructive" });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      // Doctors use PUT /tasks/:id with status update (the /complete endpoint is ASSISTANT-only)
      await axios.put(`${BASE_URL}/api/v1/tasks/${taskId}`, { status: "completed" }, authHeaders());
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed", completedDate: new Date().toISOString().split("T")[0] } : t));
      toast({ title: "Task completed!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to complete task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${BASE_URL}/api/v1/tasks/${taskId}`, authHeaders());
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: "Task deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete task", variant: "destructive" });
    }
  };

  const handleMarkReviewed = async (entryId: string) => {
    try {
      await axios.put(`${BASE_URL}/api/v1/diary-entries/${entryId}/review`, {}, authHeaders());
      setPatientEntries(prev => prev.map(e => e.id === entryId ? { ...e, doctorReviewed: true } : e));
      setAllEntries(prev => prev.map(e => e.id === entryId ? { ...e, doctorReviewed: true } : e));
      toast({ title: "Entry marked as reviewed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to mark as reviewed", variant: "destructive" });
    }
  };

  const handleSendNotification = async () => {
    if (!notifMessage) return;
    try {
      if (bulkFilter) {
        const filters: any = {};
        if (bulkFilter === "all") filters.allPatients = true;
        else filters.diaryType = bulkFilter;
        await axios.post(`${BASE_URL}/api/v1/notifications/bulk`, {
          type: "reminder",
          title: "Notification from Doctor",
          message: notifMessage,
          filters,
        }, authHeaders());
        toast({ title: "Bulk notification sent!" });
      } else if (notifRecipient) {
        await axios.post(`${BASE_URL}/api/v1/notifications/`, {
          recipientId: notifRecipient,
          recipientType: "patient",
          type: "reminder",
          title: "Notification from Doctor",
          message: notifMessage,
        }, authHeaders());
        toast({ title: "Notification sent!" });
      }
      setNotifMessage(""); setNotifRecipient(""); setBulkFilter(null);
      // Refresh notifications
      const res = await axios.get(`${BASE_URL}/api/v1/notifications/?limit=50`, authHeaders());
      const data = res.data.data?.notifications || res.data.data || [];
      setApiNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to send notification", variant: "destructive" });
    }
  };

  const handleGenerateReport = async () => {
    if (!reportPatient) return;
    setGenerating(true);
    try {
      if (reportExportType === "photos") {
        await axios.post(`${BASE_URL}/api/v1/reports/patient-data`, {
          patientId: reportPatient,
          format: "pdf",
          includeTestHistory: true,
          includeDiaryEntries: true,
        }, authHeaders());
      } else {
        await axios.post(`${BASE_URL}/api/v1/reports/patient-data`, {
          patientId: reportPatient,
          format: reportFormat === "xlsx" ? "excel" : reportFormat,
          includeTestHistory: reportIncludes.treatment,
          includeDiaryEntries: reportIncludes.entries,
        }, authHeaders());
      }
      toast({ title: "Report generation started!", description: "Check Recent Exports for download." });
      // Refresh exports
      const res = await axios.get(`${BASE_URL}/api/v1/reports/exports?limit=20`, authHeaders());
      const data = res.data.data?.exports || res.data.data || [];
      setRecentExports(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadExport = async (exportId: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/reports/exports/${exportId}/download`, authHeaders());
      const downloadUrl = res.data.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      } else {
        toast({ title: "Export still processing", description: "Please try again later." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to download", variant: "destructive" });
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    try {
      await axios.delete(`${BASE_URL}/api/v1/reports/exports/${exportId}`, authHeaders());
      setRecentExports(prev => prev.filter(e => e.id !== exportId));
      toast({ title: "Export deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const applyTemplate = (template: { title: string; type: string; priority: string; dueDays: number }) => {
    setTaskTitle(template.title);
    setTaskType(template.type);
    setTaskPriority(template.priority);
    const due = new Date(); due.setDate(due.getDate() + template.dueDays);
    setTaskDueDate(due.toISOString().split("T")[0]);
  };

  // ==================== DERIVED DATA ====================
  const pendingReviews = dashboardStats?.diaryEntries?.pendingReviews ?? allEntries.filter(e => !e.doctorReviewed).length;

  const filteredPatients = myPatients
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.diaryId || "").toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search));

  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);

  const trendData = patientEntries.map(e => ({
    page: `Page ${e.pageNumber}`,
    pain: e.parsedData.painLevel,
    nausea: e.parsedData.nausea ? 6 : 0,
    sleep: e.parsedData.sleepQuality === "poor" ? 8 : e.parsedData.sleepQuality === "fair" ? 4 : 2,
  }));

  const adherenceData = patientEntries.map(e => ({
    page: `P${e.pageNumber}`,
    taken: e.parsedData.medications.length,
    missed: Math.max(0, 3 - e.parsedData.medications.length),
  }));

  const reportPatientData = myPatients.find(p => p.id === reportPatient);
  const reportEntries = patientEntries.length > 0 && selectedPatientId === reportPatient
    ? patientEntries
    : allEntries.filter(e => e.patientId === reportPatient);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // ========== PATIENT DETAIL VIEW ==========
  if (selectedPatient) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedPatientId(null)} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Button>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="h-16 w-16 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary-foreground">{selectedPatient.name.split(" ").map((n: string) => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-display font-bold">{selectedPatient.name}</h2>
                    {selectedPatient.diaryType && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full capitalize">{selectedPatient.diaryType}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Age: {selectedPatient.age} · {selectedPatient.gender} · {selectedPatient.stage} · {selectedPatient.phone}</p>
                  <p className="text-sm text-muted-foreground">Diary: {selectedPatient.diaryId} · Registered: {selectedPatient.registeredDate}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Calling patient..." })}><Phone className="h-4 w-4 mr-1" />Call</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Diary Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Registration Date</span><p className="font-medium">{selectedPatient.registeredDate}</p></div>
                <div><span className="text-muted-foreground">Assigned Doctor</span><p className="font-medium">{user?.fullName || "—"}</p></div>
                <div><span className="text-muted-foreground">Pages Uploaded</span><p className="font-medium">{patientEntries.length}</p></div>
                <div><span className="text-muted-foreground">Last Upload</span><p className="font-medium">{patientEntries[patientEntries.length - 1]?.uploadDate || "—"}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Diary Pages</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {patientEntries.map(entry => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${entry.flagged ? "border-destructive/30 bg-destructive/5" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Page {entry.pageNumber}</p>
                      <div className="flex items-center gap-1">
                        {entry.doctorReviewed ? <span className="text-xs text-success">Reviewed</span> : <span className="text-xs text-warning">Unreviewed</span>}
                      </div>
                    </div>
                    <div className="bg-muted rounded h-24 flex items-center justify-center mb-2 overflow-hidden">
                      {entry.imageUrl ? (
                        <img
                          src={entry.imageUrl.startsWith("http") ? entry.imageUrl : `/uploads/${entry.imageUrl.replace(/^.*uploads\//, "")}`}
                          alt={`Diary page ${entry.pageNumber}`}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.removeAttribute("style");
                          }}
                        />
                      ) : null}
                      <BookOpen
                        className="h-8 w-8 text-muted-foreground/40"
                        style={entry.imageUrl ? { display: "none" } : undefined}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.uploadDate}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Pain: <strong>{entry.parsedData.painLevel}/10</strong></span>
                      <span>Appetite: {entry.parsedData.appetite}</span>
                    </div>
                    {!entry.doctorReviewed && (
                      <Button size="sm" variant="outline" className="w-full mt-2 text-xs h-7" onClick={() => handleMarkReviewed(entry.id)}>Mark Reviewed</Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ===== UPLOADED PHOTOS (from /upload/image-history) ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Diary Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {photoHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Image className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No diary photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {photoHistory.map((photo: { id?: string; fileName: string; imagePath?: string; url?: string; imageUrl?: string; createdAt?: string }, idx: number) => {
                    const src = `${BASE_URL}/uploads/${photo.fileName}`;
                    return (
                      <div
                        key={photo.id || idx}
                        className="group relative rounded-lg overflow-hidden border bg-muted aspect-square cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                      >
                        <img
                          src={src}
                          alt={`Diary photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        {/* Shown when image fails to load */}
                        <div style={{ display: "none" }} className="absolute inset-0 flex-col items-center justify-center gap-1 text-muted-foreground/50 bg-muted">
                          <Image className="h-6 w-6" />
                          <span className="text-[10px]">Not available</span>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end pointer-events-none">
                          <span className="w-full text-[10px] text-white bg-black/50 px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : photo.fileName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Symptom Severity</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pain" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Pain" />
                    <Line type="monotone" dataKey="sleep" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Sleep Issues" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Medication Adherence</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="taken" fill="hsl(142, 71%, 45%)" name="Taken" />
                    <Bar dataKey="missed" fill="hsl(0, 84%, 60%)" name="Missed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Photo Lightbox */}
        <Dialog open={!!lightboxPhoto} onOpenChange={(open) => { if (!open) setLightboxPhoto(null); }}>
          <DialogContent className="max-w-2xl p-2">
            <DialogHeader className="px-4 pt-2">
              <DialogTitle className="text-sm font-medium text-muted-foreground">
                {lightboxPhoto?.createdAt
                  ? new Date(lightboxPhoto.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : lightboxPhoto?.fileName}
              </DialogTitle>
            </DialogHeader>
            {lightboxPhoto && (() => {
              const src = `${BASE_URL}/uploads/${lightboxPhoto.fileName}`
              return (
                <div className="relative bg-black/5 rounded-lg overflow-hidden flex items-center justify-center min-h-64">
                  <img
                    src={src}
                    alt="Diary photo"
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div style={{ display: "none" }} className="absolute inset-0 flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Image className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">Image not available</p>
                    <p className="text-xs text-center max-w-xs opacity-70">
                      This image may have been uploaded to a different server.<br />
                      Ensure the mobile app is pointing to this backend ({import.meta.env.VITE_API_BASE_URL}).
                    </p>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // ========== DASHBOARD (with patients table) ==========
  if (currentPage === "/doctor" || currentPage === "/doctor/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Patients" value={dashboardStats?.patients?.total ?? myPatients.length} icon={Users} />
            <StatCard title="Active Cases" value={dashboardStats?.patients?.activeCases ?? myPatients.length} icon={Activity} variant="success" />
            <StatCard title="This Week's Entries" value={dashboardStats?.diaryEntries?.thisWeek ?? allEntries.length} icon={BookOpen} />
            <StatCard title="Pending Reviews" value={pendingReviews} icon={ClipboardCheck} variant="warning" />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by patient name, diary ID, or phone number..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={diaryTypeFilter} onValueChange={setDiaryTypeFilter}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Diary Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="peri-operative">Peri-Operative</SelectItem>
                  <SelectItem value="post-operative">Post-Operative</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="chemotherapy">Chemotherapy</SelectItem>
                  <SelectItem value="radiology">Radiology</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Patients Table */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">All Patients</CardTitle></CardHeader>
            <CardContent>
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No patients registered yet</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Patient Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Diary ID</TableHead><TableHead>Stage</TableHead><TableHead>Registered</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map(p => (
                        <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedPatientId(p.id)}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.age}</TableCell>
                          <TableCell>{p.gender}</TableCell>
                          <TableCell className="font-mono text-xs">{p.diaryId}</TableCell>
                          <TableCell><span className="capitalize text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{p.stage || "—"}</span></TableCell>
                          <TableCell className="text-sm">{p.registeredDate}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); setSelectedPatientId(p.id); }}><Eye className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); toast({ title: "Notification sent to " + p.name }); }}><Bell className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); toast({ title: "Calling " + p.name }); }}><Phone className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== DIARY ENTRIES ==========
  if (currentPage.includes("/diary-entries")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">All Diary Entries</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Patient</TableHead><TableHead>Page Type</TableHead><TableHead>Page</TableHead><TableHead>Upload Date</TableHead><TableHead>Pain</TableHead><TableHead>Flagged</TableHead><TableHead>Reviewed</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEntries.map(e => {
                      const patientName = e.patient?.name || e.patient?.fullName || myPatients.find(pt => pt.id === e.patientId)?.name || "—";
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{patientName}</TableCell>
                          <TableCell><span className="capitalize text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{e.pageType}</span></TableCell>
                          <TableCell>Page {e.pageNumber}</TableCell>
                          <TableCell className="text-sm">{e.uploadDate}</TableCell>
                          <TableCell>{e.parsedData.painLevel}/10</TableCell>
                          <TableCell>{e.flagged ? <span className="text-xs text-destructive font-medium">Yes</span> : "No"}</TableCell>
                          <TableCell>{e.doctorReviewed ? <span className="text-xs text-success">Reviewed</span> : <span className="text-xs text-warning">Pending</span>}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => { const p = myPatients.find(pt => pt.id === e.patientId); if (p) setSelectedPatientId(p.id); }}><Eye className="h-3 w-3" /></Button>
                              {!e.doctorReviewed && (
                                <Button size="sm" variant="ghost" className="h-7 text-success" onClick={() => handleMarkReviewed(e.id)}><CheckCircle2 className="h-3 w-3" /></Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== ASSISTANT MANAGEMENT ==========
  if (currentPage.includes("/assistants")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">My Assistants</CardTitle>
              <Dialog open={addAssistantOpen} onOpenChange={setAddAssistantOpen}>
                <DialogTrigger asChild><Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Create Assistant</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Assistant</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddAssistant} className="space-y-3">
                    <div><Label>Name *</Label><Input name="name" required /></div>
                    <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                    <div><Label>Phone</Label><Input name="phone" type="tel" /></div>
                    <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Create</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {myAssistants.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No assistants yet. Create one to get started.</TableCell></TableRow>
                    ) : myAssistants.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>{a.phone || "—"}</TableCell>
                        <TableCell><StatusBadge status={a.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== TASK ASSIGNMENT ==========
  if (currentPage.includes("/tasks")) {
    const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
    const completedTasks = tasks.filter(t => t.status === "completed");

    const quickTemplates = [
      { icon: "📋", title: "Review Today's Diary Updates", template: { title: "Review all diary entries uploaded today", type: "review-entries", priority: "medium", dueDays: 0 } },
      { icon: "💊", title: "Send Chemotherapy Reminders", template: { title: "Send reminders to patients with chemotherapy this week", type: "send-reminders", priority: "high", dueDays: 1 } },
      { icon: "📞", title: "Follow-up with New Patients", template: { title: "Call patients registered in the last 7 days", type: "call-patients", priority: "medium", dueDays: 1 } },
      { icon: "⚠️", title: "Check Missed Diary Entries", template: { title: "Contact patients who haven't made entries in 3+ days", type: "follow-up", priority: "medium", dueDays: 0 } },
    ];

    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold">Assign Tasks to Assistants</h2>
            <p className="text-sm text-muted-foreground">Delegate routine tasks to your healthcare assistants</p>
          </div>

          {/* Quick Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickTemplates.map((qt, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-clinical-md transition-shadow" onClick={() => applyTemplate(qt.template)}>
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">{qt.icon}</span>
                  <p className="text-sm font-medium mt-2">{qt.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to auto-fill</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Task Form */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Create New Task</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div><Label>Task Title *</Label><Input placeholder="e.g., Review today's diary entries" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} maxLength={100} /></div>
              <div><Label>Task Description</Label><Textarea placeholder="Add specific instructions, patient details, or important notes..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} maxLength={500} rows={3} /><p className="text-xs text-muted-foreground mt-1">{taskDesc.length}/500</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Task Type *</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{taskTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To Assistant *</Label>
                  {myAssistants.length === 0 ? (
                    <Button variant="outline" className="w-full mt-1" onClick={() => window.location.href = "/doctor/assistants"}><Plus className="h-4 w-4 mr-1" />Create Assistant First</Button>
                  ) : (
                    <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                      <SelectTrigger><SelectValue placeholder="Select assistant" /></SelectTrigger>
                      <SelectContent>{myAssistants.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.email})</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div>
                <Label>Priority *</Label>
                <div className="flex gap-3 mt-2">
                  {priorityOptions.map(p => (
                    <button key={p.value} onClick={() => setTaskPriority(p.value)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${taskPriority === p.value ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50"}`}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Due Date *</Label><Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
                <div>
                  <Label>Related Patients</Label>
                  <Select onValueChange={v => setTaskPatients(prev => prev.includes(v) ? prev : [...prev, v])}>
                    <SelectTrigger><SelectValue placeholder="Add patients..." /></SelectTrigger>
                    <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.diaryId}</SelectItem>)}</SelectContent>
                  </Select>
                  {taskPatients.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      <span className="text-xs text-muted-foreground">{taskPatients.length} patients selected</span>
                      <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={() => setTaskPatients([])}>Clear all</Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetTaskForm}>Cancel</Button>
                <Button className="flex-1 gradient-teal text-primary-foreground" onClick={handleCreateTask} disabled={!taskTitle || !taskType || !taskAssignee || !taskDueDate}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />Create & Assign Task
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task Tables */}
          <Tabs defaultValue="active">
            <TabsList><TabsTrigger value="active">Active Tasks ({activeTasks.length})</TabsTrigger><TabsTrigger value="completed">Completed Tasks ({completedTasks.length})</TabsTrigger></TabsList>
            <TabsContent value="active">
              <Card>
                <CardContent className="pt-4">
                  {activeTasks.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No active tasks. Create a task to get started.</p>
                  ) : (
                    <div className="rounded-lg border overflow-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-muted/50"><TableHead>Task Title</TableHead><TableHead>Type</TableHead><TableHead>Assigned To</TableHead><TableHead>Priority</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {activeTasks.map(t => {
                            const assignee = myAssistants.find(a => a.id === t.assignedTo);
                            const isOverdue = new Date(t.dueDate) < new Date();
                            return (
                              <TableRow key={t.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{t.title}</TableCell>
                                <TableCell><span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{taskTypeOptions.find(o => o.value === t.taskType)?.label || t.taskType}</span></TableCell>
                                <TableCell>{t.assigneeName || assignee?.name || "—"}</TableCell>
                                <TableCell><span className="text-xs">{priorityOptions.find(p => p.value === t.priority)?.icon} {t.priority}</span></TableCell>
                                <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>{isOverdue ? "Overdue: " : ""}{t.dueDate}</TableCell>
                                <TableCell><StatusBadge status={t.status === "pending" ? "pending" : "active"} /></TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7" onClick={() => handleCompleteTask(t.id)}><CheckCircle2 className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleDeleteTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="completed">
              <Card>
                <CardContent className="pt-4">
                  {completedTasks.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No completed tasks yet.</p>
                  ) : (
                    <div className="rounded-lg border overflow-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-muted/50"><TableHead>Task Title</TableHead><TableHead>Type</TableHead><TableHead>Assigned To</TableHead><TableHead>Completed Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {completedTasks.map(t => {
                            const assignee = myAssistants.find(a => a.id === t.assignedTo);
                            return (
                              <TableRow key={t.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{t.title}</TableCell>
                                <TableCell><span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{taskTypeOptions.find(o => o.value === t.taskType)?.label || t.taskType}</span></TableCell>
                                <TableCell>{t.assigneeName || assignee?.name || "—"}</TableCell>
                                <TableCell>{t.completedDate || "—"}</TableCell>
                                <TableCell><Button size="sm" variant="ghost" className="h-7"><Eye className="h-3 w-3" /></Button></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // ========== NOTIFICATIONS ==========
  if (currentPage.includes("/notifications")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Send Notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>To Individual Patient</Label>
                <Select value={notifRecipient} onValueChange={v => { setNotifRecipient(v); setBulkFilter(null); }}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or Bulk Send</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <Button size="sm" variant={bulkFilter === "all" ? "default" : "outline"} onClick={() => { setBulkFilter("all"); setNotifRecipient(""); }}>All Patients</Button>
                  <Button size="sm" variant={bulkFilter === "chemotherapy" ? "default" : "outline"} onClick={() => { setBulkFilter("chemotherapy"); setNotifRecipient(""); }}>Chemotherapy</Button>
                  <Button size="sm" variant={bulkFilter === "peri-operative" ? "default" : "outline"} onClick={() => { setBulkFilter("peri-operative"); setNotifRecipient(""); }}>Peri-Operative</Button>
                </div>
                {bulkFilter && <p className="text-xs text-muted-foreground mt-1">Sending to: {bulkFilter === "all" ? "All patients" : `${bulkFilter} patients`}</p>}
              </div>
              <div>
                <Label>Template</Label>
                <Select onValueChange={v => setNotifMessage(v)}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Your next appointment is coming up. Please confirm your attendance.">Appointment Reminder</SelectItem>
                    <SelectItem value="Your lab report is ready. Please visit the hospital to collect it.">Lab Report Ready</SelectItem>
                    <SelectItem value="Please remember to fill in your diary entries daily.">Diary Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Message</Label><Textarea placeholder="Type your message..." className="min-h-[100px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">{notifMessage.length}/500</p></div>
              <Button className="gradient-teal text-primary-foreground" onClick={handleSendNotification} disabled={!notifMessage || (!notifRecipient && !bulkFilter)}><Send className="h-4 w-4 mr-2" />Send</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Notification History</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Date/Time</TableHead><TableHead>Type</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {apiNotifications.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No notifications yet.</TableCell></TableRow>
                    ) : apiNotifications.map(n => (
                      <TableRow key={n.id}>
                        <TableCell className="text-sm">{n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}</TableCell>
                        <TableCell><span className="capitalize text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{n.type}</span></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{n.message}</TableCell>
                        <TableCell><StatusBadge status={n.read ? "active" : "pending"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== PROFILE ==========
  if (currentPage.includes("/profile")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-display font-bold">My Profile</h2>
            <p className="text-sm text-muted-foreground">Update your personal information and account security</p>
          </div>

          {/* Edit Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle className="h-5 w-5" />Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={profileEmail}
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                  placeholder="Email (cannot be changed)"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  type="tel"
                />
              </div>
              <Button
                className="gradient-teal text-primary-foreground"
                onClick={handleUpdateProfile}
                disabled={profileLoading || !profileName.trim()}
              >
                {profileLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5" />Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrentPwd(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPwd(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordLoading ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== REPORTS ==========
  return (
    <DashboardLayout navItems={navItems} roleLabel="Doctor">
      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold">Patient Reports & Data Export</h2>

        {/* Select Patient */}
        <Card>
          <CardHeader><CardTitle className="text-base">Select Patient</CardTitle></CardHeader>
          <CardContent>
            <Select value={reportPatient} onValueChange={setReportPatient}>
              <SelectTrigger><SelectValue placeholder="Search by patient name or diary ID" /></SelectTrigger>
              <SelectContent>
                {myPatients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.diaryId} ({p.stage || "N/A"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reportPatientData && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">{reportPatientData.name.split(" ").map((n: string) => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="font-bold">{reportPatientData.name}</p>
                    <p className="text-sm text-muted-foreground">{reportPatientData.age}y · {reportPatientData.gender} · {reportPatientData.diaryId}</p>
                  </div>
                  <div className="ml-auto text-right text-sm">
                    <p><span className="text-muted-foreground">Stage:</span> <span className="capitalize">{reportPatientData.stage}</span></p>
                    <p><span className="text-muted-foreground">Tests:</span> {reportPatientData.testCompletionPercentage}% complete</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {reportPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Data Export */}
            <Card className={`cursor-pointer border-2 transition-all ${reportExportType === "data" ? "border-secondary" : "border-border"}`} onClick={() => setReportExportType("data")}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileDown className="h-5 w-5" />Export Diary Entry Data</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {Object.entries(reportIncludes).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox checked={val} onCheckedChange={c => setReportIncludes(prev => ({ ...prev, [key]: !!c }))} />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">From</Label><Input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} /></div>
                  <div><Label className="text-xs">To</Label><Input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} /></div>
                </div>
                <div className="flex gap-2">
                  {["pdf", "xlsx", "csv"].map(f => (
                    <button key={f} onClick={e => { e.stopPropagation(); setReportFormat(f); }} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${reportFormat === f ? "border-secondary bg-secondary/10 text-secondary" : "border-border"}`}>
                      {f === "pdf" ? "PDF" : f === "xlsx" ? "Excel" : "CSV"}
                    </button>
                  ))}
                </div>
                {reportExportType === "data" && (
                  <Button className="w-full gradient-teal text-primary-foreground" onClick={handleGenerateReport} disabled={generating}>
                    {generating ? "Generating..." : "Generate Data Report"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Photo Export */}
            <Card className={`cursor-pointer border-2 transition-all ${reportExportType === "photos" ? "border-secondary" : "border-border"}`} onClick={() => setReportExportType("photos")}>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Image className="h-5 w-5" />Export Diary Page Photos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {reportPhotoLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading photos...</span>
                  </div>
                ) : reportPhotoHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Image className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No uploaded photos for this patient</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{reportPhotoHistory.length} photo(s) available</p>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                      {reportPhotoHistory.map((photo, idx) => {
                        const photoKey = photo.id || photo.fileName;
                        const isSelected = selectedPhotoIds.includes(photoKey);
                        const src = `${BASE_URL}/uploads/${photo.fileName}`;
                        return (
                          <div
                            key={photoKey}
                            onClick={ev => {
                              ev.stopPropagation();
                              setSelectedPhotoIds(prev =>
                                prev.includes(photoKey) ? prev.filter(id => id !== photoKey) : [...prev, photoKey]
                              );
                            }}
                            className={`relative rounded-lg border-2 overflow-hidden aspect-square cursor-pointer transition-all ${isSelected ? "border-secondary ring-2 ring-secondary/30" : "border-border"}`}
                          >
                            <img
                              src={src}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div style={{ display: "none" }} className="absolute inset-0 flex-col items-center justify-center gap-1 bg-muted text-muted-foreground/50">
                              <Image className="h-5 w-5" />
                              <span className="text-[9px]">N/A</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                              <p className="text-[9px] text-white truncate">
                                {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString("en-IN") : photo.fileName}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedPhotoIds.length === reportPhotoHistory.length}
                        onCheckedChange={c => setSelectedPhotoIds(c ? reportPhotoHistory.map(p => p.id || p.fileName) : [])}
                      />
                      <span className="text-sm">Select All</span>
                      {selectedPhotoIds.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">{selectedPhotoIds.length} selected</span>
                      )}
                    </div>
                    {reportExportType === "photos" && (
                      <Button
                        className="w-full gradient-teal text-primary-foreground"
                        onClick={e => { e.stopPropagation(); handleExportPhotosPDF(); }}
                        disabled={exportingPdf || selectedPhotoIds.length === 0}
                      >
                        {exportingPdf ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating PDF...</> : <><FileDown className="h-4 w-4 mr-2" />Export {selectedPhotoIds.length} Photo(s) as PDF</>}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Exports */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Exports</CardTitle></CardHeader>
          <CardContent>
            {recentExports.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No exports yet. Select a patient and generate a report above.</p>
            ) : (
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Type</TableHead><TableHead>Format</TableHead><TableHead>Generated</TableHead><TableHead>Status</TableHead><TableHead>Size</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {recentExports.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium capitalize">{exp.type?.replace(/-/g, " ") || "—"}</TableCell>
                        <TableCell className="uppercase text-xs">{exp.format || "—"}</TableCell>
                        <TableCell className="text-sm">{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell><StatusBadge status={exp.status === "completed" ? "active" : "pending"} /></TableCell>
                        <TableCell className="text-sm">{exp.fileSize ? `${(exp.fileSize / 1024 / 1024).toFixed(1)} MB` : "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDownloadExport(exp.id)} disabled={exp.status !== "completed"}><Download className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleDeleteExport(exp.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
