import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, AlertTriangle, BookOpen, Activity, Search, Phone, Eye, ArrowLeft,
  Send, UserPlus, Plus, Settings, Download, Bell, FileText,
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
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const navItems = [
  { label: "Dashboard", path: "/doctor", icon: Activity },
  { label: "My Patients", path: "/doctor/patients", icon: Users },
  { label: "Assistant Management", path: "/doctor/assistants", icon: Settings },
  { label: "Notifications", path: "/doctor/notifications", icon: Bell },
  { label: "Reports", path: "/doctor/reports", icon: FileText },
];

export default function DoctorDashboard() {
  const { patients, diaryEntries, assistants, setAssistants } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [diaryTypeFilter, setDiaryTypeFilter] = useState("all");
  const [addAssistantOpen, setAddAssistantOpen] = useState(false);
  const [notifSearch, setNotifSearch] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRecipient, setNotifRecipient] = useState("");
  const [bulkPatients, setBulkPatients] = useState<string[]>([]);

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const criticalCount = myPatients.filter(p => p.riskLevel === "critical").length;
  const allEntries = diaryEntries.filter(e => myPatients.some(p => p.id === e.patientId));

  const filteredPatients = myPatients
    .filter(p => riskFilter === "all" || p.riskLevel === riskFilter)
    .filter(p => diaryTypeFilter === "all" || p.diaryType === diaryTypeFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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

  const riskColor = (r: string) => r === "critical" ? "bg-destructive" : r === "high" ? "bg-warning" : "bg-success";

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

  // ========== PATIENT DETAIL VIEW ==========
  if (selectedPatient) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
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
                    {selectedPatient.diaryType && <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full capitalize">{selectedPatient.diaryType}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Age: {selectedPatient.age} · {selectedPatient.gender} · {selectedPatient.stage} · {selectedPatient.phone}</p>
                  <p className="text-sm text-muted-foreground">Diary: {selectedPatient.diaryId} · Registered: {selectedPatient.registeredDate}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Calling patient..." })}><Phone className="h-4 w-4 mr-1" />Call</Button>
              </div>
              {selectedPatient.riskLevel !== "normal" && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">{selectedPatient.riskLevel === "critical" ? "Critical alerts reported" : "Elevated risk — monitor closely"}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diary Info */}
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

          {/* Diary Pages Gallery */}
          <Card>
            <CardHeader><CardTitle className="text-base">Diary Pages</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {patientEntries.map(entry => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${entry.flagged ? "border-destructive/30 bg-destructive/5" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">Page {entry.pageNumber}</p>
                      <div className="flex items-center gap-1">
                        {entry.flagged && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        {entry.doctorReviewed ? <span className="text-xs text-success">Reviewed</span> : <span className="text-xs text-warning">Unreviewed</span>}
                      </div>
                    </div>
                    <div className="bg-muted rounded h-24 flex items-center justify-center mb-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.uploadDate}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Pain: <strong className={entry.parsedData.painLevel >= 7 ? "text-destructive" : ""}>{entry.parsedData.painLevel}/10</strong></span>
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

          {/* Health Trends */}
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

  // ========== DASHBOARD OVERVIEW ==========
  if (currentPage === "/doctor" || currentPage === "/doctor/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Patients" value={myPatients.length} icon={Users} />
            <StatCard title="Active Cases" value={myPatients.filter(p => p.status === "active").length} icon={Activity} variant="success" />
            <StatCard title="Critical Alerts" value={criticalCount} icon={AlertTriangle} variant="destructive" />
            <StatCard title="Entries This Week" value={allEntries.length} icon={BookOpen} />
          </div>

          {/* Quick patient overview */}
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

  // ========== MY PATIENTS (TABLE) ==========
  if (currentPage.includes("/patients")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="flex gap-2 flex-wrap">
              {["all", "critical", "high", "normal"].map(r => (
                <Button key={r} size="sm" variant={riskFilter === r ? "default" : "outline"} onClick={() => setRiskFilter(r)} className="capitalize">{r}</Button>
              ))}
              <Select value={diaryTypeFilter} onValueChange={setDiaryTypeFilter}>
                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Diary Type" /></SelectTrigger>
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
                            <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); toast({ title: "Notification sent to " + p.name }); }}><Bell className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={e => { e.stopPropagation(); toast({ title: "Calling " + p.name }); }}><Phone className="h-3 w-3" /></Button>
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
                    {assistants.filter(a => a.doctorId === "D001").map(a => (
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

  // ========== NOTIFICATIONS ==========
  if (currentPage.includes("/notifications")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-6">
          {/* Send Notification */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Send Notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>To Individual Patient</Label>
                <Select value={notifRecipient} onValueChange={setNotifRecipient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {myPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Or Bulk Select</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.map(p => p.id))}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.filter(p => p.riskLevel === "critical").map(p => p.id))}>Critical Only</Button>
                  <Button size="sm" variant="outline" onClick={() => setBulkPatients(myPatients.filter(p => p.riskLevel === "high").map(p => p.id))}>High Risk</Button>
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

          {/* History */}
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
  return (
    <DashboardLayout navItems={navItems} roleLabel="Doctor">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Export Patient Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" /></div>
              <div><Label>End Date</Label><Input type="date" /></div>
            </div>
            <div className="space-y-2"><Label>Include</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Checkbox defaultChecked /><span className="text-sm">Patient Demographics</span></div>
                <div className="flex items-center gap-2"><Checkbox defaultChecked /><span className="text-sm">Diary Entries</span></div>
                <div className="flex items-center gap-2"><Checkbox defaultChecked /><span className="text-sm">Symptoms Data</span></div>
                <div className="flex items-center gap-2"><Checkbox /><span className="text-sm">Lab Reports</span></div>
              </div>
            </div>
            <Button className="gradient-teal text-primary-foreground" onClick={() => toast({ title: "Report generated!", description: "Download started." })}><Download className="h-4 w-4 mr-2" />Generate Report</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
