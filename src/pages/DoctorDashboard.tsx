import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, BookOpen, Activity, Search, Phone, Eye, ArrowLeft,
  Send, UserPlus, Plus, Settings, Download, Bell, FileText,
  ClipboardCheck, CheckCircle2, Trash2, Edit, Calendar as CalendarIcon,
  Image, FileDown,
} from "lucide-react";
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
import type { TaskType, TaskPriority } from "@/data/mockData";

const navItems = [
  { label: "Dashboard", path: "/doctor", icon: Activity },
  { label: "Diary Entries", path: "/doctor/diary-entries", icon: BookOpen },
  { label: "Assistant Management", path: "/doctor/assistants", icon: Settings },
  { label: "Task Assignment", path: "/doctor/tasks", icon: ClipboardCheck },
  { label: "Notifications", path: "/doctor/notifications", icon: Bell },
  { label: "Reports", path: "/doctor/reports", icon: FileText },
];

const taskTypeOptions: { value: TaskType; label: string }[] = [
  { value: "review_entries", label: "Review Diary Entries" },
  { value: "send_notifications", label: "Send Patient Notifications" },
  { value: "follow_up_calls", label: "Follow-up Calls" },
  { value: "schedule_appointments", label: "Schedule Appointments" },
  { value: "data_entry", label: "Data Entry" },
  { value: "patient_checkin", label: "Patient Check-in" },
  { value: "lab_report_followup", label: "Lab Report Follow-up" },
  { value: "other", label: "Other" },
];

const priorityOptions: { value: TaskPriority; label: string; color: string; icon: string }[] = [
  { value: "low", label: "Low", color: "text-blue-500", icon: "🔵" },
  { value: "medium", label: "Medium", color: "text-yellow-500", icon: "🟡" },
  { value: "high", label: "High", color: "text-orange-500", icon: "🟠" },
  { value: "urgent", label: "Urgent", color: "text-red-500", icon: "🔴" },
];

export default function DoctorDashboard() {
  const { patients, diaryEntries, assistants, setAssistants, tasks, setTasks } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [lastEntryFilter, setLastEntryFilter] = useState("all");
  const [addAssistantOpen, setAddAssistantOpen] = useState(false);
  const [notifSearch, setNotifSearch] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRecipient, setNotifRecipient] = useState("");
  const [bulkPatients, setBulkPatients] = useState<string[]>([]);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
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
  const [recentExports, setRecentExports] = useState<{ patient: string; type: string; date: string; range: string; size: string }[]>([]);
  const [generating, setGenerating] = useState(false);

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const allEntries = diaryEntries.filter(e => myPatients.some(p => p.id === e.patientId));
  const pendingReviews = allEntries.filter(e => !e.doctorReviewed).length;
  const myAssistants = assistants.filter(a => a.doctorId === "D001");

  const filteredPatients = myPatients
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.diaryId.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);
  const patientEntries = diaryEntries.filter(e => e.patientId === selectedPatientId);

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

  const handleAddAssistant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setAssistants(prev => [...prev, {
      id: `A${String(prev.length + 1).padStart(3, "0")}`,
      role: "assistant",
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      doctorId: "D001",
      permissions: {
        viewPatients: !!fd.get("viewPatients"),
        callPatients: !!fd.get("callPatients"),
        exportData: !!fd.get("exportData"),
        sendNotifications: !!fd.get("sendNotifications"),
      },
      status: "active",
    }]);
    setAddAssistantOpen(false);
    toast({ title: "Assistant added!" });
  };

  const resetTaskForm = () => {
    setTaskTitle(""); setTaskDesc(""); setTaskType(""); setTaskAssignee(""); setTaskPriority("medium"); setTaskDueDate(""); setTaskPatients([]);
  };

  const handleCreateTask = () => {
    if (!taskTitle || !taskType || !taskAssignee || !taskDueDate) return;
    const newTask = {
      id: `T${String(tasks.length + 1).padStart(3, "0")}`,
      title: taskTitle,
      description: taskDesc || undefined,
      taskType: taskType as TaskType,
      assignedTo: taskAssignee,
      assignedBy: "Dr. Priya Sharma",
      priority: taskPriority,
      dueDate: taskDueDate,
      status: "assigned" as const,
      patientIds: taskPatients.length > 0 ? taskPatients : undefined,
      createdDate: new Date().toISOString().split("T")[0],
    };
    setTasks(prev => [...prev, newTask]);
    toast({ title: "✅ Task assigned to " + (myAssistants.find(a => a.id === taskAssignee)?.name || "assistant") });
    resetTaskForm();
  };

  const applyTemplate = (template: { title: string; type: TaskType; priority: TaskPriority; dueDays: number }) => {
    setTaskTitle(template.title);
    setTaskType(template.type);
    setTaskPriority(template.priority);
    const due = new Date(); due.setDate(due.getDate() + template.dueDays);
    setTaskDueDate(due.toISOString().split("T")[0]);
  };

  const handleGenerateReport = () => {
    if (!reportPatient) return;
    setGenerating(true);
    const patient = myPatients.find(p => p.id === reportPatient);
    setTimeout(() => {
      setGenerating(false);
      setRecentExports(prev => [{
        patient: patient?.name || "",
        type: reportExportType === "data" ? "Data Export" : "Photo PDF",
        date: new Date().toISOString().split("T")[0],
        range: `${reportDateFrom || "All"} → ${reportDateTo || "All"}`,
        size: reportExportType === "data" ? "2.4 MB" : "15.8 MB",
      }, ...prev]);
      toast({ title: "✅ Report generated successfully", description: "Download started." });
    }, 2000);
  };

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
                  <span className="text-xl font-bold text-primary-foreground">{selectedPatient.name.split(" ").map(n => n[0]).join("")}</span>
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
                <div><span className="text-muted-foreground">Assigned Doctor</span><p className="font-medium">Dr. Priya Sharma</p></div>
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
                    <div className="bg-muted rounded h-24 flex items-center justify-center mb-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.uploadDate}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Pain: <strong>{entry.parsedData.painLevel}/10</strong></span>
                      <span>Appetite: {entry.parsedData.appetite}</span>
                    </div>
                    {!entry.doctorReviewed && (
                      <Button size="sm" variant="outline" className="w-full mt-2 text-xs h-7">Mark Reviewed</Button>
                    )}
                  </div>
                ))}
              </div>
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
      </DashboardLayout>
    );
  }

  // ========== DASHBOARD (with patients table) ==========
  if (currentPage === "/doctor" || currentPage === "/doctor/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Patients" value={myPatients.length} icon={Users} />
            <StatCard title="Active Cases" value={myPatients.filter(p => p.status === "active").length} icon={Activity} variant="success" />
            <StatCard title="This Week's Entries" value={allEntries.length} icon={BookOpen} />
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
                        <TableHead>Patient Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Diary ID</TableHead><TableHead>Diary Type</TableHead><TableHead>Registered</TableHead><TableHead>Last Entry</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map(p => (
                        <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedPatientId(p.id)}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.age}</TableCell>
                          <TableCell>{p.gender}</TableCell>
                          <TableCell className="font-mono text-xs">{p.diaryId}</TableCell>
                          <TableCell><span className="capitalize text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{p.diaryType || "—"}</span></TableCell>
                          <TableCell className="text-sm">{p.registeredDate}</TableCell>
                          <TableCell className="text-sm">{p.lastEntry}</TableCell>
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
                      <TableHead>Patient</TableHead><TableHead>Diary ID</TableHead><TableHead>Page</TableHead><TableHead>Upload Date</TableHead><TableHead>Pain</TableHead><TableHead>Flagged</TableHead><TableHead>Reviewed</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEntries.map(e => {
                      const p = myPatients.find(pt => pt.id === e.patientId);
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{p?.name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{e.diaryId}</TableCell>
                          <TableCell>Page {e.pageNumber}</TableCell>
                          <TableCell className="text-sm">{e.uploadDate}</TableCell>
                          <TableCell>{e.parsedData.painLevel}/10</TableCell>
                          <TableCell>{e.flagged ? <span className="text-xs text-destructive font-medium">⚠️ Yes</span> : "No"}</TableCell>
                          <TableCell>{e.doctorReviewed ? <span className="text-xs text-success">✓ Reviewed</span> : <span className="text-xs text-warning">Pending</span>}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => { if (p) setSelectedPatientId(p.id); }}><Eye className="h-3 w-3" /></Button>
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
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><Checkbox name="viewPatients" id="vp" defaultChecked /><label htmlFor="vp" className="text-sm">Can View Patients</label></div>
                        <div className="flex items-center gap-2"><Checkbox name="callPatients" id="cp" defaultChecked /><label htmlFor="cp" className="text-sm">Can Call Patients</label></div>
                        <div className="flex items-center gap-2"><Checkbox name="exportData" id="ed" /><label htmlFor="ed" className="text-sm">Can Export Data</label></div>
                        <div className="flex items-center gap-2"><Checkbox name="sendNotifications" id="sn" /><label htmlFor="sn" className="text-sm">Can Send Notifications</label></div>
                      </div>
                    </div>
                    <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Create</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Permissions</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {myAssistants.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {a.permissions.viewPatients && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">View</span>}
                            {a.permissions.callPatients && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">Call</span>}
                            {a.permissions.exportData && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">Export</span>}
                            {a.permissions.sendNotifications && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">Notify</span>}
                          </div>
                        </TableCell>
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
    const activeTasks = tasks.filter(t => t.status !== "completed");
    const completedTasks = tasks.filter(t => t.status === "completed");

    const quickTemplates = [
      { icon: "📋", title: "Review Today's Diary Updates", template: { title: "Review all diary entries uploaded today", type: "review_entries" as TaskType, priority: "medium" as TaskPriority, dueDays: 0 } },
      { icon: "💊", title: "Send Chemotherapy Reminders", template: { title: "Send reminders to patients with chemotherapy this week", type: "send_notifications" as TaskType, priority: "high" as TaskPriority, dueDays: 1 } },
      { icon: "📞", title: "Follow-up with New Patients", template: { title: "Call patients registered in the last 7 days", type: "follow_up_calls" as TaskType, priority: "medium" as TaskPriority, dueDays: 1 } },
      { icon: "⚠️", title: "Check Missed Diary Entries", template: { title: "Contact patients who haven't made entries in 3+ days", type: "follow_up_calls" as TaskType, priority: "medium" as TaskPriority, dueDays: 0 } },
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
                  <Select value={taskType} onValueChange={v => setTaskType(v as TaskType)}>
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
                                <TableCell>{assignee?.name || "—"}</TableCell>
                                <TableCell><span className="text-xs">{priorityOptions.find(p => p.value === t.priority)?.icon} {t.priority}</span></TableCell>
                                <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>{isOverdue ? "Overdue: " : ""}{t.dueDate}</TableCell>
                                <TableCell><StatusBadge status={t.status === "assigned" ? "pending" : t.status === "in_progress" ? "active" : "active"} /></TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7" onClick={() => { setTasks(prev => prev.map(task => task.id === t.id ? { ...task, status: "completed", completedDate: new Date().toISOString().split("T")[0] } : task)); toast({ title: "Task completed!" }); }}><CheckCircle2 className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => { setTasks(prev => prev.filter(task => task.id !== t.id)); toast({ title: "Task deleted" }); }}><Trash2 className="h-3 w-3" /></Button>
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
                                <TableCell>{assignee?.name || "—"}</TableCell>
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
                <Select value={notifRecipient} onValueChange={setNotifRecipient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or Bulk Select</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.map(p => p.id))}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.filter(p => p.diaryType === "chemotherapy").map(p => p.id))}>Chemotherapy</Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.filter(p => p.diaryType === "peri-operative").map(p => p.id))}>Peri-Operative</Button>
                </div>
                {bulkPatients.length > 0 && <p className="text-xs text-muted-foreground mt-1">Sending to {bulkPatients.length} patients</p>}
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
              <Button className="gradient-teal text-primary-foreground" onClick={() => { toast({ title: "Notification sent!" }); setNotifMessage(""); setNotifRecipient(""); setBulkPatients([]); }}><Send className="h-4 w-4 mr-2" />Send</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Notification History</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Date/Time</TableHead><TableHead>Recipients</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow><TableCell className="text-sm">2024-02-10 14:30</TableCell><TableCell>3 patients</TableCell><TableCell className="text-sm text-muted-foreground">Appointment reminder for next week...</TableCell><TableCell><StatusBadge status="active" /></TableCell></TableRow>
                    <TableRow><TableCell className="text-sm">2024-02-09 10:00</TableCell><TableCell>Sunita Devi</TableCell><TableCell className="text-sm text-muted-foreground">Lab report is ready for collection...</TableCell><TableCell><StatusBadge status="active" /></TableCell></TableRow>
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
  const reportPatientData = myPatients.find(p => p.id === reportPatient);
  const reportEntries = diaryEntries.filter(e => e.patientId === reportPatient);

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
                    {p.name} — {p.diaryId} ({p.diaryType || "N/A"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reportPatientData && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">{reportPatientData.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div>
                    <p className="font-bold">{reportPatientData.name}</p>
                    <p className="text-sm text-muted-foreground">{reportPatientData.age}y · {reportPatientData.gender} · {reportPatientData.diaryId}</p>
                  </div>
                  <div className="ml-auto text-right text-sm">
                    <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{reportPatientData.diaryType}</span></p>
                    <p><span className="text-muted-foreground">Entries:</span> {reportEntries.length}</p>
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
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileDown className="h-5 w-5" />📊 Export Diary Entry Data</CardTitle></CardHeader>
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
                      {f === "pdf" ? "📄 PDF" : f === "xlsx" ? "📊 Excel" : "📑 CSV"}
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
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Image className="h-5 w-5" />📸 Export Diary Page Photos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{reportEntries.length} pages available</p>
                <div className="grid grid-cols-4 gap-2">
                  {reportEntries.slice(0, 8).map(e => (
                    <div key={e.id} onClick={ev => { ev.stopPropagation(); setSelectedPhotoPages(prev => prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]); }} className={`p-2 rounded border text-center cursor-pointer transition-all ${selectedPhotoPages.includes(e.id) ? "border-secondary bg-secondary/10" : "border-border"}`}>
                      <BookOpen className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                      <p className="text-[10px] mt-1">P{e.pageNumber}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedPhotoPages.length === reportEntries.length} onCheckedChange={c => setSelectedPhotoPages(c ? reportEntries.map(e => e.id) : [])} />
                  <span className="text-sm">Select All Pages</span>
                  {selectedPhotoPages.length > 0 && <span className="text-xs text-muted-foreground ml-auto">{selectedPhotoPages.length} selected</span>}
                </div>
                {reportExportType === "photos" && (
                  <Button className="w-full gradient-teal text-primary-foreground" onClick={handleGenerateReport} disabled={generating || selectedPhotoPages.length === 0}>
                    {generating ? "Generating..." : "Generate Photo PDF"}
                  </Button>
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
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Patient</TableHead><TableHead>Report Type</TableHead><TableHead>Generated</TableHead><TableHead>Date Range</TableHead><TableHead>Size</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {recentExports.map((exp, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{exp.patient}</TableCell>
                        <TableCell>{exp.type}</TableCell>
                        <TableCell className="text-sm">{exp.date}</TableCell>
                        <TableCell className="text-sm">{exp.range}</TableCell>
                        <TableCell className="text-sm">{exp.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => toast({ title: "Downloading..." })}><Download className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setRecentExports(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
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
