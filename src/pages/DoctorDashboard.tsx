import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PageHeader from "@/components/common/PageHeader";
import {
  Users, AlertTriangle, BookOpen, Activity, Search, Phone, Eye, ArrowLeft,
  Send, UserPlus, Plus, Settings, Download, MessageSquare, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { label: "My Patients", path: "/doctor", icon: Users },
  { label: "Team Management", path: "/doctor/team", icon: Settings },
  { label: "Communication", path: "/doctor/communication", icon: MessageSquare },
  { label: "Reports", path: "/doctor/reports", icon: FileText },
];

export default function DoctorDashboard() {
  const { patients, diaryEntries, assistants, setAssistants, doctors } = useData();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [tab, setTab] = useState("patients");
  const [addAssistantOpen, setAddAssistantOpen] = useState(false);
  const [patientTab, setPatientTab] = useState("overview");

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const criticalCount = myPatients.filter(p => p.riskLevel === "critical").length;
  const filteredPatients = myPatients
    .filter(p => riskFilter === "all" || p.riskLevel === riskFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const selectedPatient = myPatients.find(p => p.id === selectedPatientId);
  const patientEntries = diaryEntries.filter(e => e.patientId === selectedPatientId);

  // Chart data
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

  if (selectedPatient) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Doctor">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedPatientId(null)} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Patients</Button>

          {/* Patient header */}
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
                  <p className="text-sm text-muted-foreground mt-1">Age: {selectedPatient.age} · {selectedPatient.stage} · {selectedPatient.phone}</p>
                  <p className="text-sm text-muted-foreground">Diary: {selectedPatient.diaryId} · Registered: {selectedPatient.registeredDate}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Calling patient..." })}><Phone className="h-4 w-4 mr-1" />Call</Button>
              </div>
              {selectedPatient.riskLevel !== "normal" && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    {selectedPatient.riskLevel === "critical" ? "Critical alerts reported" : "Elevated risk — monitor closely"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient tabs */}
          <Tabs value={patientTab} onValueChange={setPatientTab}>
            <TabsList className="bg-muted"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="entries">Diary Entries</TabsTrigger><TabsTrigger value="trends">Health Trends</TabsTrigger></TabsList>

            <TabsContent value="overview" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card><CardHeader><CardTitle className="text-base">Treatment Plan</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{selectedPatient.treatmentPlan}</p><p className="text-sm text-muted-foreground mt-2">Current stage: {selectedPatient.stage}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Current Medications</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{patientEntries[patientEntries.length - 1]?.parsedData.medications.map(m => <span key={m} className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{m}</span>)}</div></CardContent></Card>
            </TabsContent>

            <TabsContent value="entries" className="mt-4">
              <Card><CardContent className="pt-4">
                <div className="space-y-3">
                  {patientEntries.map(entry => (
                    <div key={entry.id} className={`p-4 rounded-lg border ${entry.flagged ? "border-destructive/30 bg-destructive/5" : "bg-card"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Page {entry.pageNumber} · <span className="text-muted-foreground text-sm">{entry.uploadDate}</span></p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Pain: <strong className={entry.parsedData.painLevel >= 7 ? "text-destructive" : ""}>{entry.parsedData.painLevel}/10</strong></span>
                            <span>Appetite: {entry.parsedData.appetite}</span>
                            <span>Sleep: {entry.parsedData.sleepQuality}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.flagged && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {entry.doctorReviewed ? <StatusBadge status="active" /> : <Button size="sm" variant="outline" className="text-xs h-7">Mark Reviewed</Button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="trends" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Symptom Severity Over Time</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="page" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pain" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Pain Level" />
                      <Line type="monotone" dataKey="sleep" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Sleep Issues" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Medication Adherence</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
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
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} roleLabel="Doctor">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={myPatients.length} icon={Users} />
          <StatCard title="Active Cases" value={myPatients.filter(p => p.status === "active").length} icon={Activity} variant="success" />
          <StatCard title="Critical Alerts" value={criticalCount} icon={AlertTriangle} variant="destructive" />
          <StatCard title="Entries This Week" value={patientEntries.length} icon={BookOpen} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="patients"><Users className="h-4 w-4 mr-1" />Patients</TabsTrigger>
            <TabsTrigger value="team"><Settings className="h-4 w-4 mr-1" />Team</TabsTrigger>
            <TabsTrigger value="comms"><Send className="h-4 w-4 mr-1" />Communication</TabsTrigger>
            <TabsTrigger value="reports"><FileText className="h-4 w-4 mr-1" />Reports</TabsTrigger>
          </TabsList>

          {/* PATIENTS TAB */}
          <TabsContent value="patients" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <div className="flex gap-2">
                {["all", "critical", "high", "normal"].map(r => (
                  <Button key={r} size="sm" variant={riskFilter === r ? "default" : "outline"} onClick={() => setRiskFilter(r)} className="capitalize">{r}</Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatients.map(p => (
                <Card key={p.id} className="hover:shadow-clinical-md transition-shadow cursor-pointer" onClick={() => setSelectedPatientId(p.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">{p.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{p.name}</h3>
                          <div className={`h-2 w-2 rounded-full ${riskColor(p.riskLevel)}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">Age {p.age} · {p.stage}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last entry: {p.lastEntry}</p>
                      </div>
                      <StatusBadge status={p.riskLevel} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"><Eye className="h-3 w-3 mr-1" />Details</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={e => { e.stopPropagation(); toast({ title: "Calling " + p.name }); }}><Phone className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">My Assistants</CardTitle>
                <Dialog open={addAssistantOpen} onOpenChange={setAddAssistantOpen}>
                  <DialogTrigger asChild><Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Assistant</Button></DialogTrigger>
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
          </TabsContent>

          {/* COMMUNICATION TAB */}
          <TabsContent value="comms" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg font-display">Broadcast Message</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Recipients</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select patient group" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Patients</SelectItem><SelectItem value="high">High Risk</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Message</Label><Textarea placeholder="Type your message..." className="min-h-[120px]" /></div>
                <Button className="gradient-teal text-primary-foreground"><Send className="h-4 w-4 mr-2" />Send Broadcast</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

