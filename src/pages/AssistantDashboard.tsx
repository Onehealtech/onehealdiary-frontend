import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, ClipboardList, Eye, Phone, Lock, Activity,
  Search, ArrowLeft, BookOpen, Bell, Send, Download, FileText,
  ClipboardCheck, CheckCircle2, Image, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const navItems = [
  { label: "Dashboard", path: "/assistant", icon: Activity },
  { label: "Diary Entries", path: "/assistant/diary-entries", icon: BookOpen },
  { label: "Tasks", path: "/assistant/tasks", icon: ClipboardList },
  { label: "Notifications", path: "/assistant/notifications", icon: Bell },
  { label: "Reports", path: "/assistant/reports", icon: FileText },
];

const myPermissions = { viewPatients: true, callPatients: true, exportData: false, sendNotifications: false };

const AssistantBanner = () => (
  <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
    You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
  </div>
);

export default function AssistantDashboard() {
  const { patients, tasks, setTasks, diaryEntries } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  const [search, setSearch] = useState("");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState("");

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const allEntries = diaryEntries.filter(e => myPatients.some(p => p.id === e.patientId));
  const filteredPatients = myPatients
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.diaryId.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));
  const myTasks = tasks;
  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);
  const patientEntries = diaryEntries.filter(e => e.patientId === selectedPatientId);
  const pendingReviews = allEntries.filter(e => !e.doctorReviewed).length;

  const trendData = patientEntries.map(e => ({
    page: `Page ${e.pageNumber}`,
    pain: e.parsedData.painLevel,
    sleep: e.parsedData.sleepQuality === "poor" ? 8 : e.parsedData.sleepQuality === "fair" ? 4 : 2,
  }));

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
        <TooltipContent>🔒 Permission required. Contact Dr. Priya Sharma</TooltipContent>
      </Tooltip>
    );
  };

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
                  <span className="text-xl font-bold text-primary-foreground">{selectedPatient.name.split(" ").map(n => n[0]).join("")}</span>
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
            <StatCard title="Total Patients" value={myPatients.length} icon={Users} />
            <StatCard title="Active Cases" value={myPatients.filter(p => p.status === "active").length} icon={Activity} variant="success" />
            <StatCard title="Pending Tasks" value={myTasks.filter(t => t.status !== "completed").length} icon={ClipboardList} variant="warning" />
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
                          <TableCell><Button size="sm" variant="ghost" className="h-7" onClick={() => { if (p) setSelectedPatientId(p.id); }}><Eye className="h-3 w-3" /></Button></TableCell>
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
    const taskTypeLabels: Record<string, string> = {
      review_entries: "Review Diary Entries", send_notifications: "Send Notifications",
      follow_up_calls: "Follow-up Calls", schedule_appointments: "Schedule Appointments",
      data_entry: "Data Entry", patient_checkin: "Patient Check-in",
      lab_report_followup: "Lab Report Follow-up", other: "Other",
    };
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
                          <TableCell><StatusBadge status={t.status === "assigned" ? "pending" : "active"} /></TableCell>
                          <TableCell>
                            {t.status !== "completed" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                setTasks(prev => prev.map(task => task.id === t.id ? { ...task, status: "completed", completedDate: new Date().toISOString().split("T")[0] } : task));
                                toast({ title: "Task completed!" });
                              }}><CheckCircle2 className="h-3 w-3 mr-1" />Done</Button>
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
                  <div><Label>Message</Label><Textarea placeholder="Type your message..." className="min-h-[100px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} /></div>
                  <Button className="gradient-teal text-primary-foreground"><Send className="h-4 w-4 mr-2" />Send</Button>
                </div>
              </PermissionGate>
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
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.diaryId}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="gradient-teal text-primary-foreground"><Download className="h-4 w-4 mr-2" />Generate Report</Button>
              </div>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
