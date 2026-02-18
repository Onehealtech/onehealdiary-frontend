import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, ClipboardList, Eye, Phone, Lock, Activity,
  Search, ArrowLeft, BookOpen, Bell, Send, Download, FileText,
  ClipboardCheck, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const { user } = useAuth();
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
      try {
        const [pRes, eRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/v1/patient/${selectedPatientId}`, authHeaders()),
          axios.get(`${BASE_URL}/api/v1/diary-entries/?patientId=${selectedPatientId}&limit=100`, authHeaders()),
        ]);
        const patient = pRes.data.data || pRes.data;
        setMyPatients(prev => prev.map(p => p.id === selectedPatientId ? mapPatient(patient) : p));
        const entries = eRes.data.data?.entries || eRes.data.data || [];
        setPatientEntries(entries.map((e: any, i: number) => mapEntry(e, i)));
      } catch (err) {
        console.error("Error fetching patient detail:", err);
        setPatientEntries(allEntries.filter(e => e.patientId === selectedPatientId));
      }
    };
    fetchDetail();
  }, [selectedPatientId]);

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
    if (!notifMessage || !notifRecipient) return;
    try {
      await axios.post(`${BASE_URL}/api/v1/notifications/`, {
        recipientId: notifRecipient,
        recipientType: "patient",
        type: "reminder",
        title: "Notification from Assistant",
        message: notifMessage,
      }, authHeaders());
      toast({ title: "Notification sent!" });
      setNotifMessage(""); setNotifRecipient("");
      // Refresh
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
      await axios.post(`${BASE_URL}/api/v1/reports/patient-data`, {
        patientId: reportPatient,
        format: "pdf",
        includeTestHistory: true,
        includeDiaryEntries: true,
      }, authHeaders());
      toast({ title: "Report generation started!", description: "Check back for download." });
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
              <PermissionGate permission={myPermissions.sendNotifications} action="Send Notifications">
                <div className="space-y-4">
                  <div>
                    <Label>To Patient</Label>
                    <Select value={notifRecipient} onValueChange={setNotifRecipient}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Message</Label><Textarea placeholder="Type your message..." className="min-h-[100px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} /></div>
                  <Button className="gradient-teal text-primary-foreground" onClick={handleSendNotification} disabled={!notifMessage || !notifRecipient}><Send className="h-4 w-4 mr-2" />Send</Button>
                </div>
              </PermissionGate>
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

  // ========== REPORTS ==========
  return (
    <DashboardLayout navItems={navItems} roleLabel="Assistant">
      <div className="space-y-4">
        <AssistantBanner />
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Patient Reports & Data Export</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PermissionGate permission={myPermissions.exportData} action="Generate Reports">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select a patient and export their data.</p>
                <Select value={reportPatient} onValueChange={setReportPatient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.diaryId}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="gradient-teal text-primary-foreground" onClick={handleGenerateReport} disabled={!reportPatient || generating}>
                  <Download className="h-4 w-4 mr-2" />{generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </PermissionGate>

            {recentExports.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Recent Exports</h3>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Type</TableHead><TableHead>Format</TableHead><TableHead>Status</TableHead><TableHead>Generated</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {recentExports.map(exp => (
                        <TableRow key={exp.id}>
                          <TableCell className="capitalize">{exp.type?.replace(/-/g, " ") || "—"}</TableCell>
                          <TableCell className="uppercase text-xs">{exp.format || "—"}</TableCell>
                          <TableCell><StatusBadge status={exp.status === "completed" ? "active" : "pending"} /></TableCell>
                          <TableCell className="text-sm">{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
