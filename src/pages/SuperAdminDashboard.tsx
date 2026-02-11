import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, Store, BookOpen, Clock, Plus, Search, DollarSign, FileText,
  UserPlus, ShieldCheck, CreditCard, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "User Management", path: "/super-admin", icon: Users },
  { label: "Inventory & Approvals", path: "/super-admin/inventory", icon: BookOpen },
  { label: "Financials", path: "/super-admin/financials", icon: CreditCard },
  { label: "Compliance Audit", path: "/super-admin/audit", icon: ClipboardList },
];

export default function SuperAdminDashboard() {
  const { doctors, setDoctors, vendors, setVendors, diaries, setDiaries, patients, auditLogs } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("users");
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const pendingDiaries = diaries.filter(d => d.status === "pending").length;

  const handleAddDoctor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newDoc = {
      id: `D${String(doctors.length + 1).padStart(3, "0")}`,
      role: "doctor" as const,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      hospital: fd.get("hospital") as string,
      license: fd.get("license") as string,
      specialization: "Oncology",
      status: "active" as const,
    };
    setDoctors(prev => [...prev, newDoc]);
    setAddDoctorOpen(false);
    toast({ title: "Doctor onboarded!", description: "Credentials sent to email." });
  };

  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newVendor = {
      id: `V${String(vendors.length + 1).padStart(3, "0")}`,
      role: "vendor" as const,
      name: fd.get("name") as string,
      location: fd.get("location") as string,
      phone: fd.get("phone") as string,
      bankDetails: fd.get("bank") as string,
      walletBalance: 0,
      diariesSold: 0,
      commissionRate: 50,
      status: "active" as const,
    };
    setVendors(prev => [...prev, newVendor]);
    setAddVendorOpen(false);
    toast({ title: "Vendor onboarded!", description: "Account created successfully." });
  };

  const handleApproveDiary = (id: string) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, status: "active" as const } : d));
    toast({ title: "Diary approved!", description: `${id} is now active.` });
  };

  const handleRejectDiary = (id: string) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, status: "rejected" as const } : d));
    toast({ title: "Diary rejected", variant: "destructive" });
  };

  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.hospital.toLowerCase().includes(search.toLowerCase()));
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.location.toLowerCase().includes(search.toLowerCase()));
  const filteredDiaries = filterStatus === "all" ? diaries : diaries.filter(d => d.status === filterStatus);

  const totalCommission = vendors.reduce((s, v) => s + v.walletBalance, 0);

  return (
    <DashboardLayout navItems={navItems} roleLabel="Super Admin">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Doctors" value={doctors.length} icon={Users} />
          <StatCard title="Total Vendors" value={vendors.length} icon={Store} />
          <StatCard title="Active Diaries" value={diaries.filter(d => d.status === "active").length} icon={BookOpen} variant="success" />
          <StatCard title="Pending Approvals" value={pendingDiaries} icon={Clock} variant="warning" />
        </div>

        {/* Main Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
            <TabsTrigger value="inventory"><BookOpen className="h-4 w-4 mr-1.5" />Inventory</TabsTrigger>
            <TabsTrigger value="financials"><DollarSign className="h-4 w-4 mr-1.5" />Financials</TabsTrigger>
            <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-1.5" />Audit</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6 mt-4">
            {/* Doctors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-display">Doctors</CardTitle>
                <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Doctor</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Onboard New Doctor</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddDoctor} className="space-y-3">
                      <div><Label>Name *</Label><Input name="name" required /></div>
                      <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                      <div><Label>Hospital *</Label><Input name="hospital" required /></div>
                      <div><Label>Medical License *</Label><Input name="license" required /></div>
                      <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Submit</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search doctors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Hospital</TableHead><TableHead>License</TableHead><TableHead>Specialization</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoctors.slice(0, 10).map(d => (
                        <TableRow key={d.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.hospital}</TableCell>
                          <TableCell className="font-mono text-xs">{d.license}</TableCell>
                          <TableCell>{d.specialization}</TableCell>
                          <TableCell><StatusBadge status={d.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Vendors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-display">Vendors</CardTitle>
                <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Vendor</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Onboard New Vendor</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddVendor} className="space-y-3">
                      <div><Label>Business Name *</Label><Input name="name" required /></div>
                      <div><Label>Location *</Label><Input name="location" required /></div>
                      <div><Label>Phone *</Label><Input name="phone" required /></div>
                      <div><Label>Bank Details *</Label><Input name="bank" required /></div>
                      <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Submit</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Phone</TableHead><TableHead>Diaries Sold</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendors.slice(0, 10).map(v => (
                        <TableRow key={v.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>{v.location}</TableCell>
                          <TableCell>{v.phone}</TableCell>
                          <TableCell>{v.diariesSold}</TableCell>
                          <TableCell className="font-semibold">₹{v.walletBalance.toLocaleString()}</TableCell>
                          <TableCell><StatusBadge status={v.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTORY TAB */}
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Diary Activations</CardTitle>
                <div className="flex gap-2 mt-2">
                  {["all", "pending", "active", "rejected"].map(s => (
                    <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)} className="capitalize">{s}</Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50"><TableHead>Diary ID</TableHead><TableHead>Patient</TableHead><TableHead>Vendor</TableHead><TableHead>Doctor</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiaries.map(d => {
                        const patient = patients.find(p => p.id === d.patientId);
                        const vendor = vendors.find(v => v.id === d.vendorId);
                        const doctor = doctors.find(doc => doc.id === d.doctorId);
                        return (
                          <TableRow key={d.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs">{d.id}</TableCell>
                            <TableCell>{patient?.name || "—"}</TableCell>
                            <TableCell>{vendor?.name || "—"}</TableCell>
                            <TableCell>{doctor?.name || "—"}</TableCell>
                            <TableCell>{d.activationDate}</TableCell>
                            <TableCell><StatusBadge status={d.status} /></TableCell>
                            <TableCell>
                              {d.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-success" onClick={() => handleApproveDiary(d.id)}>✓ Approve</Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => handleRejectDiary(d.id)}>✗ Reject</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Commission Pool" value={`₹${totalCommission.toLocaleString()}`} icon={DollarSign} />
              <StatCard title="Pending Payouts" value={`₹${Math.round(totalCommission * 0.36).toLocaleString()}`} icon={Clock} variant="warning" />
              <StatCard title="Paid This Month" value={`₹${Math.round(totalCommission * 0.64).toLocaleString()}`} icon={CreditCard} variant="success" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg font-display">Vendor Wallets</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Vendor</TableHead><TableHead>Balance</TableHead><TableHead>Diaries Sold</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {vendors.filter(v => v.walletBalance > 0).map(v => (
                        <TableRow key={v.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="font-semibold">₹{v.walletBalance.toLocaleString()}</TableCell>
                          <TableCell>{v.diariesSold}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast({ title: "Payout processed", description: `₹${v.walletBalance} transferred to ${v.name}` })}>
                              Transfer Funds
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg font-display">Audit Logs</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {auditLogs.map(l => (
                        <TableRow key={l.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs">{new Date(l.timestamp).toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{l.userName}</TableCell>
                          <TableCell><StatusBadge status={l.role.toLowerCase() === "super admin" ? "active" : "normal"} /></TableCell>
                          <TableCell>{l.action}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.details}</TableCell>
                          <TableCell className="font-mono text-xs">{l.ipAddress}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
