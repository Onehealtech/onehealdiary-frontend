import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, ClipboardList, Eye, Phone, Lock, AlertTriangle, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

const navItems = [
  { label: "My Patients", path: "/assistant", icon: Users },
  { label: "Tasks", path: "/assistant/tasks", icon: ClipboardList },
];

export default function AssistantDashboard() {
  const { patients, tasks, setTasks, diaryEntries } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState("patients");
  const [search, setSearch] = useState("");
  const [permDenied, setPermDenied] = useState(false);

  const myPatients = patients.filter(p => p.doctorId === "D001");
  const filtered = myPatients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const myTasks = tasks;

  const riskColor = (r: string) => r === "critical" ? "bg-destructive" : r === "high" ? "bg-warning" : "bg-success";

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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="patients"><Users className="h-4 w-4 mr-1" />Patients</TabsTrigger>
            <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4 mr-1" />Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search patients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <Button variant="outline" disabled onClick={() => setPermDenied(true)} className="opacity-50"><Lock className="h-4 w-4 mr-1" />Export</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <Card key={p.id} className="hover:shadow-clinical-md transition-shadow">
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
                        <p className="text-xs text-muted-foreground mt-1">Plan: {p.treatmentPlan}</p>
                      </div>
                      <StatusBadge status={p.riskLevel} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"><Eye className="h-3 w-3 mr-1" />View</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Calling " + p.name })}><Phone className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
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
          </TabsContent>
        </Tabs>

        <Dialog open={permDenied} onOpenChange={setPermDenied}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Permission Required</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">You don't have permission to export data. Please contact Dr. Priya Sharma.</p>
            <Button variant="outline" onClick={() => setPermDenied(false)}>Close</Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
