import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, ClipboardList, Eye, Phone, Lock, AlertTriangle, Activity,
  Search, ArrowLeft, BookOpen, Bell, Send, Download, FileText, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const navItems = [
  { label: "Dashboard", path: "/assistant", icon: Activity },
  { label: "My Patients", path: "/assistant/patients", icon: Users },
  { label: "Tasks", path: "/assistant/tasks", icon: ClipboardList },
  { label: "Notifications", path: "/assistant/notifications", icon: Bell },
  { label: "Reports", path: "/assistant/reports", icon: FileText },
];

// Mock permissions for logged-in assistant
const myPermissions = { viewPatients: true, callPatients: true, exportData: false, sendNotifications: false };

export default function AssistantDashboard() {
  const { patients, tasks, setTasks, diaryEntries } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const filteredPatients = myPatients
    .filter(p => riskFilter === "all" || p.riskLevel === riskFilter)
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const myTasks = tasks;
  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);
  const patientEntries = diaryEntries.filter(e => e.patientId === selectedPatientId);

  const riskColor = (r: string) => r === "critical" ? "bg-destructive" : r === "high" ? "bg-warning" : "bg-success";

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
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
            You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
          </div>
          <Button variant="ghost" onClick={() => setSelectedPatientId(null)} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Patients</Button>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="h-16 w-16 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary-foreground">{selectedPatient.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-display font-bold">{selectedPatient.name}</h2>
                    <StatusBadge status={selectedPatient.riskLevel} />
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

          {/* Diary Pages Gallery */}
          <Card>
            <CardHeader><CardTitle className="text-base">Diary Pages</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {patientEntries.map(entry => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${entry.flagged ? "border-destructive/30 bg-destructive/5" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Page {entry.pageNumber}</p>
                      {entry.flagged && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </div>
                    <div className="bg-muted rounded h-24 flex items-center justify-center mb-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.uploadDate}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Pain: <strong className={entry.parsedData.painLevel >= 7 ? "text-destructive" : ""}>{entry.parsedData.painLevel}/10</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trends */}
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

  // ========== DASHBOARD ==========
  if (currentPage === "/assistant" || currentPage === "/assistant/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-6">
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
            You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Patients" value={myPatients.length} icon={Users} />
            <StatCard title="Pending Tasks" value={myTasks.filter(t => t.status !== "completed").length} icon={ClipboardList} variant="warning" />
            <StatCard title="Critical Alerts" value={myPatients.filter(p => p.riskLevel === "critical").length} icon={AlertTriangle} variant="destructive" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Recent Critical Patients</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myPatients.filter(p => p.riskLevel !== "normal").slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${riskColor(p.riskLevel)}`} />
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.stage} · Last entry: {p.lastEntry}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.riskLevel} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ========== PATIENTS TABLE ==========
  if (currentPage.includes("/patients")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-4">
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
            You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="flex gap-2 flex-wrap">
              {["all", "critical", "high", "normal"].map(r => (
                <Button key={r} size="sm" variant={riskFilter === r ? "default" : "outline"} onClick={() => setRiskFilter(r)} className="capitalize">{r}</Button>
              ))}
              <PermissionGate permission={myPermissions.exportData} action="Export">
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
              </PermissionGate>
            </div>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Patient Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Diary ID</TableHead><TableHead>Diary Type</TableHead><TableHead>Registered</TableHead><TableHead>Last Entry</TableHead><TableHead>Risk Level</TableHead><TableHead>Actions</TableHead>
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
                        <TableCell><StatusBadge status={p.riskLevel} /></TableCell>
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
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
            You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Assigned Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50"><TableHead>Task</TableHead><TableHead>Assigned By</TableHead><TableHead>Priority</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTasks.map(t => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>{t.assignedBy}</TableCell>
                        <TableCell><StatusBadge status={t.priority === "high" ? "critical" : t.priority === "medium" ? "high" : "normal"} /></TableCell>
                        <TableCell className="text-sm">{t.dueDate}</TableCell>
                        <TableCell><StatusBadge status={t.status === "completed" ? "active" : t.status} /></TableCell>
                        <TableCell>
                          {t.status !== "completed" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                              setTasks(prev => prev.map(task => task.id === t.id ? { ...task, status: "completed" } : task));
                              toast({ title: "Task completed!" });
                            }}>Mark Done</Button>
                          )}
                        </TableCell>
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

  // ========== NOTIFICATIONS ==========
  if (currentPage.includes("/notifications")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Assistant">
        <div className="space-y-6">
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
            You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
          </div>

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
        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-sm text-secondary font-medium">
          You are viewing as Assistant for <strong>Dr. Priya Sharma</strong>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Export Patient Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" /></div>
              <div><Label>End Date</Label><Input type="date" /></div>
            </div>
            <PermissionGate permission={myPermissions.exportData} action="Generate Report">
              <Button className="gradient-teal text-primary-foreground"><Download className="h-4 w-4 mr-2" />Generate Report</Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
