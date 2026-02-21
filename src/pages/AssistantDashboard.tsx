import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, ClipboardList, Eye, EyeOff, Phone, Lock, Activity,
  Search, ArrowLeft, BookOpen, Bell, Send, Download, FileText,
  ClipboardCheck, CheckCircle2, Loader2, UserCircle, Image, FileDown, Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const navItems = [
  { label: "Dashboard", path: "/assistant", icon: Activity },
  { label: "Diary Entries", path: "/assistant/diary-entries", icon: BookOpen },
  { label: "Tasks", path: "/assistant/tasks", icon: ClipboardList },
  { label: "Notifications", path: "/assistant/notifications", icon: Bell },
  { label: "Reports", path: "/assistant/reports", icon: FileText },
  { label: "Profile", path: "/assistant/profile", icon: UserCircle },
];

const taskTypeLabels: Record<string, string> = {
  "review-entries": "Review Diary Entries",
  "call-patients": "Call Patients",
  "send-reminders": "Send Reminders",
  "follow-up": "Follow-up",
  "export-data": "Export Data",
  "other": "Other",
  // Legacy mock values fallback
  "review_entries": "Review Diary Entries",
  "send_notifications": "Send Notifications",
  "follow_up_calls": "Follow-up Calls",
  "schedule_appointments": "Schedule Appointments",
  "data_entry": "Data Entry",
  "patient_checkin": "Patient Check-in",
  "lab_report_followup": "Lab Report Follow-up",
};

// --- Normalize API responses ---
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
  registeredDate: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "—",
  status: "active" as const,
  stage: p.stage || "—",
  lastEntry: "—",
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
  completedDate: t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : undefined,
});

export default function AssistantDashboard() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  // ---- API data state ----
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [apiNotifications, setApiNotifications] = useState<any[]>([]);
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [patientEntries, setPatientEntries] = useState<any[]>([]);
  const [myPermissions, setMyPermissions] = useState({ viewPatients: true, callPatients: true, exportData: false, sendNotifications: false });

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRecipient, setNotifRecipient] = useState("");
  const [reportPatient, setReportPatient] = useState("");
  const [generating, setGenerating] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<string | null>(null);
  const [reportExportType, setReportExportType] = useState<"data" | "photos">("data");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");
  const [reportIncludes, setReportIncludes] = useState({ demographics: true, treatment: true, entries: true, symptoms: true, medications: true, appointments: true });

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

  // Photo export state
  const [reportPhotoHistory, setReportPhotoHistory] = useState<{ id?: string; fileName: string; imagePath?: string; createdAt?: string }[]>([]);
  const [reportPhotoLoading, setReportPhotoLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  // ==================== DATA FETCHING ====================

  // Fetch assistant dashboard stats + permissions
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/dashboard/assistant`, authHeaders());
        const data = res.data.data;
        setDashboardStats(data);
        if (data?.permissions) setMyPermissions(data.permissions);
      } catch (err) {
        console.error("Error fetching assistant dashboard:", err);
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

  // Fetch patient detail when selected
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientEntries([]);
      return;
    }
    const fetchDetail = async () => {
      const [pRes, eRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/v1/patient/${selectedPatientId}`, authHeaders()),
        axios.get(`${BASE_URL}/api/v1/diary-entries/?patientId=${selectedPatientId}&limit=100`, authHeaders()),
      ]);

      if (pRes.status === "fulfilled") {
        const patient = pRes.value.data.data || pRes.value.data;
        setMyPatients(prev => prev.map(p => p.id === selectedPatientId ? mapPatient(patient) : p));
      } else {
        console.error("Error fetching patient detail:", pRes.reason);
      }

      if (eRes.status === "fulfilled") {
        const entries = eRes.value.data.data?.entries || eRes.value.data.data || [];
        setPatientEntries(entries.map((e: any, i: number) => mapEntry(e, i)));
      } else {
        console.error("Error fetching diary entries:", eRes.reason);
        setPatientEntries(allEntries.filter(e => e.patientId === selectedPatientId));
      }
    };
    fetchDetail();
  }, [selectedPatientId]);

  // Clear selected patient when navigating away from the root assistant page
  useEffect(() => {
    if (currentPage !== "/assistant" && currentPage !== "/assistant/") {
      setSelectedPatientId(null);
    }
  }, [currentPage]);

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

  const handleCompleteTask = async (taskId: string) => {
    try {
      await axios.put(`${BASE_URL}/api/v1/tasks/${taskId}/complete`, {}, authHeaders());
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed", completedDate: new Date().toISOString().split("T")[0] } : t));
      toast({ title: "Task completed!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to complete task", variant: "destructive" });
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
          title: "Notification from Assistant",
          message: notifMessage,
          filters,
        }, authHeaders());
        toast({ title: "Bulk notification sent!" });
      } else if (notifRecipient) {
        await axios.post(`${BASE_URL}/api/v1/notifications/`, {
          recipientId: notifRecipient,
          recipientType: "patient",
          type: "reminder",
          title: "Notification from Assistant",
          message: notifMessage,
        }, authHeaders());
        toast({ title: "Notification sent!" });
      }
      setNotifMessage(""); setNotifRecipient(""); setBulkFilter(null);
      // Refresh
      const res = await axios.get(`${BASE_URL}/api/v1/notifications/?limit=50`, authHeaders());
      const data = res.data.data?.notifications || res.data.data || [];
      setApiNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to send notification", variant: "destructive" });
    }
  };

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
          pdf.setFontSize(13); pdf.setTextColor(0, 0, 0);
          pdf.text(`${patientName} — Diary Photo`, 10, 14);
          pdf.setFontSize(8); pdf.setTextColor(120, 120, 120);
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
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportPatient) return;
    setGenerating(true);
    try {
      await axios.post(`${BASE_URL}/api/v1/reports/patient-data`, {
        patientId: reportPatient,
        format: reportFormat === "xlsx" ? "excel" : reportFormat,
        includeTestHistory: reportIncludes.treatment,
        includeDiaryEntries: reportIncludes.entries,
      }, authHeaders());
      toast({ title: "Report generation started!", description: "Check Recent Exports for download." });
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

  // ==================== DERIVED DATA ====================
  const pendingReviews = allEntries.filter(e => !e.doctorReviewed).length;
  const filteredPatients = myPatients
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.diaryId || "").toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search));
  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);
  const myTasks = tasks;

  const trendData = patientEntries.map(e => ({
    page: `Page ${e.pageNumber}`,
    pain: e.parsedData.painLevel,
    sleep: e.parsedData.sleepQuality === "poor" ? 8 : e.parsedData.sleepQuality === "fair" ? 4 : 2,
  }));

  // ==================== COMPONENTS ====================
  const AssistantBanner = () => (
    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
      You are viewing as Assistant for <strong>{dashboardStats?.doctorName || "your Doctor"}</strong>
    </div>
  );

  const PermissionGate = ({ permission, children, action }: { permission: boolean; children: React.ReactNode; action: string }) => {
    if (permission) return <>{children}</>;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button size="sm" variant="outline" className="opacity-50 cursor-not-allowed" disabled>
              <Lock className="h-3 w-3 mr-1" />{action}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Permission required. Contact your Doctor.</TooltipContent>
      </Tooltip>
    );
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // ========== PATIENT DETAIL ==========
  if (selectedPatient) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-4">
          <AssistantBanner />
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
                  <p className="text-sm text-muted-foreground mt-1">Age: {selectedPatient.age} · {selectedPatient.gender} · {selectedPatient.stage}</p>
                  <p className="text-sm text-muted-foreground">Diary: {selectedPatient.diaryId}</p>
                </div>
                <PermissionGate permission={myPermissions.callPatients} action="Call">
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Calling..." })}><Phone className="h-4 w-4 mr-1" />Call</Button>
                </PermissionGate>
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
                      {entry.doctorReviewed ? <span className="text-xs text-success">Reviewed</span> : <span className="text-xs text-warning">Unreviewed</span>}
                    </div>
                    <div className="bg-muted rounded h-24 flex items-center justify-center mb-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.uploadDate}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Pain: <strong>{entry.parsedData.painLevel}/10</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Symptom Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pain" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Pain" />
                  <Line type="monotone" dataKey="sleep" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Sleep Issues" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== DASHBOARD (with patient table) ==========
  if (currentPage === "/assistant" || currentPage === "/assistant/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-6">
          <AssistantBanner />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Patients" value={dashboardStats?.patients?.total ?? myPatients.length} icon={Users} />
            <StatCard title="Active Cases" value={dashboardStats?.patients?.activeCases ?? myPatients.length} icon={Activity} variant="success" />
            <StatCard title="Pending Tasks" value={dashboardStats?.tasks?.pending ?? myTasks.filter(t => t.status !== "completed").length} icon={ClipboardList} variant="warning" />
            <StatCard title="Pending Reviews" value={pendingReviews} icon={ClipboardCheck} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by patient name, diary ID, or phone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
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
              <PermissionGate permission={myPermissions.exportData} action="Export">
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
              </PermissionGate>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">All Patients</CardTitle></CardHeader>
            <CardContent>
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12"><Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground font-medium">No patients registered yet</p></div>
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
                              <PermissionGate permission={myPermissions.callPatients} action="Call">
                                <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); toast({ title: "Calling " + p.name }); }}><Phone className="h-3 w-3" /></Button>
                              </PermissionGate>
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
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-4">
          <AssistantBanner />
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
                          <TableCell><Button size="sm" variant="ghost" className="h-7" onClick={() => { const p = myPatients.find(pt => pt.id === e.patientId); if (p) setSelectedPatientId(p.id); }}><Eye className="h-3 w-3" /></Button></TableCell>
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

  // ========== TASKS ==========
  if (currentPage.includes("/tasks")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-4">
          <AssistantBanner />
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Assigned Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50"><TableHead>Task</TableHead><TableHead>Type</TableHead><TableHead>Assigned By</TableHead><TableHead>Priority</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTasks.filter(t => t.status !== "completed").map(t => {
                      const isOverdue = new Date(t.dueDate) < new Date();
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{t.title}</TableCell>
                          <TableCell><span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{taskTypeLabels[t.taskType] || t.taskType}</span></TableCell>
                          <TableCell>{t.assignedBy}</TableCell>
                          <TableCell className="capitalize text-sm">{t.priority}</TableCell>
                          <TableCell className={isOverdue ? "text-destructive font-medium" : "text-sm"}>{isOverdue ? "Overdue: " : ""}{t.dueDate}</TableCell>
                          <TableCell><StatusBadge status={t.status === "pending" ? "pending" : "active"} /></TableCell>
                          <TableCell>
                            {t.status !== "completed" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCompleteTask(t.id)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />Done
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {myTasks.filter(t => t.status !== "completed").length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active tasks assigned.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== NOTIFICATIONS ==========
  if (currentPage.includes("/notifications")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-6">
          <AssistantBanner />
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
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-6 max-w-2xl">
          <AssistantBanner />
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
                <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profileEmail} disabled className="bg-muted/50 cursor-not-allowed" placeholder="Email (cannot be changed)" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="e.g., +91 98765 43210" type="tel" />
              </div>
              <Button className="gradient-teal text-primary-foreground" onClick={handleUpdateProfile} disabled={profileLoading || !profileName.trim()}>
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
                  <Input type={showCurrentPwd ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter your current password" className="pr-10" />
                  <button type="button" tabIndex={-1} onClick={() => setShowCurrentPwd(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min. 6 characters)" className="pr-10" />
                  <button type="button" tabIndex={-1} onClick={() => setShowNewPwd(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
              <Button variant="outline" onClick={handleChangePassword} disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
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
    <DashboardLayout navItems={navItems} roleLabel="Assistant">
      <div className="space-y-6">
        <AssistantBanner />
        <h2 className="text-xl font-display font-bold">Patient Reports & Data Export</h2>

        {/* Select Patient */}
        <Card>
          <CardHeader><CardTitle className="text-base">Select Patient</CardTitle></CardHeader>
          <CardContent>
            <Select value={reportPatient} onValueChange={setReportPatient}>
              <SelectTrigger><SelectValue placeholder="Search by patient name or diary ID" /></SelectTrigger>
              <SelectContent>
                {myPatients.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.diaryId} ({p.stage || "N/A"})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reportPatient && (() => {
              const pd = myPatients.find(p => p.id === reportPatient);
              if (!pd) return null;
              return (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">{pd.name.split(" ").map((n: string) => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="font-bold">{pd.name}</p>
                      <p className="text-sm text-muted-foreground">{pd.age}y · {pd.gender} · {pd.diaryId}</p>
                    </div>
                    <div className="ml-auto text-right text-sm">
                      <p><span className="text-muted-foreground">Stage:</span> <span className="capitalize">{pd.stage}</span></p>
                    </div>
                  </div>
                </div>
              );
            })()}
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
                    <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading photos...</span>
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
                        return (
                          <div
                            key={photoKey}
                            onClick={ev => { ev.stopPropagation(); setSelectedPhotoIds(prev => prev.includes(photoKey) ? prev.filter(id => id !== photoKey) : [...prev, photoKey]); }}
                            className={`relative rounded-lg border-2 overflow-hidden aspect-square cursor-pointer transition-all ${isSelected ? "border-secondary ring-2 ring-secondary/30" : "border-border"}`}
                          >
                            <img
                              src={`${BASE_URL}/uploads/${photo.fileName}`}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={e => { e.currentTarget.style.display = "none"; const f = e.currentTarget.nextElementSibling as HTMLElement; if (f) f.style.display = "flex"; }}
                            />
                            <div style={{ display: "none" }} className="absolute inset-0 flex-col items-center justify-center gap-1 bg-muted text-muted-foreground/50">
                              <Image className="h-5 w-5" /><span className="text-[9px]">N/A</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                              <p className="text-[9px] text-white truncate">{photo.createdAt ? new Date(photo.createdAt).toLocaleDateString("en-IN") : photo.fileName}</p>
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
                      {selectedPhotoIds.length > 0 && <span className="text-xs text-muted-foreground ml-auto">{selectedPhotoIds.length} selected</span>}
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
                    {recentExports.map(exp => (
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
