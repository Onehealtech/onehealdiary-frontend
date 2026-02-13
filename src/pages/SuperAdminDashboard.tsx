import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users, Store, BookOpen, Clock, Plus, Search, DollarSign, FileText,
  CreditCard, ClipboardList, ShieldCheck, IndianRupee, Percent, Receipt,
  Download, Filter, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "User Management", path: "/super-admin", icon: Users },
  { label: "Diary Inventory", path: "/super-admin/diary-inventory", icon: Package },
  { label: "Inventory & Approvals", path: "/super-admin/inventory", icon: BookOpen },
  { label: "Financials", path: "/super-admin/financials", icon: CreditCard },
  { label: "Compliance Audit", path: "/super-admin/audit", icon: ClipboardList },
];

export default function SuperAdminDashboard() {
  const { doctors, setDoctors, vendors, setVendors, diaries, setDiaries, patients, auditLogs, superAdmins, setSuperAdmins } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [statementOpen, setStatementOpen] = useState(false);
  const [auditRoleFilter, setAuditRoleFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");

  const currentPage = location.pathname;
  const pendingDiaries = diaries.filter(d => d.status === "pending").length;
  const activeDiaries = diaries.filter(d => d.status === "active").length;
  const completedDiaries = diaries.filter(d => d.status === "completed").length;
  const totalRevenue = diaries.filter(d => d.status === "active").length * 500;
  const totalCommission = diaries.filter(d => d.status === "active").length * 50;

  const handleAddDoctor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newDoc = {
      id: `D${String(doctors.length + 1).padStart(3, "0")}`,
      role: "doctor" as const,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      hospital: fd.get("hospital") as string,
      license: fd.get("license") as string,
      licenseRegistration: fd.get("licenseReg") as string,
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
    const vendorId = `V${String(vendors.length + 1).padStart(3, "0")}`;
    const newVendor = {
      id: vendorId,
      role: "vendor" as const,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      location: fd.get("location") as string,
      phone: fd.get("phone") as string,
      gst: fd.get("gst") as string,
      bankDetails: fd.get("bank") as string || "",
      walletBalance: 0,
      diariesSold: 0,
      commissionRate: Number(fd.get("commission")) || 50,
      status: "active" as const,
    };
    setVendors(prev => [...prev, newVendor]);
    setAddVendorOpen(false);
    toast({ title: "Vendor onboarded!", description: `Vendor ID: ${vendorId}` });
  };

  const handleAddAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirmPassword") as string;
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSuperAdmins(prev => [...prev, {
      id: `SA${String(prev.length + 1).padStart(3, "0")}`,
      role: "super_admin",
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      createdDate: new Date().toISOString().split("T")[0],
      status: "active",
    }]);
    setAddAdminOpen(false);
    toast({ title: "Super Admin created!" });
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
  const filteredAuditLogs = auditLogs
    .filter(l => auditRoleFilter === "all" || l.role.toLowerCase() === auditRoleFilter)
    .filter(l => auditActionFilter === "all" || l.action === auditActionFilter);

  const auditActions = [...new Set(auditLogs.map(l => l.action))];

  // ========== USER MANAGEMENT ==========
  if (currentPage === "/super-admin" || currentPage === "/super-admin/") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Super Admin">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Doctors" value={doctors.length} icon={Users} />
            <StatCard title="Total Vendors" value={vendors.length} icon={Store} />
            <StatCard title="Active Diaries" value={activeDiaries} icon={BookOpen} variant="success" />
            <StatCard title="Pending Approvals" value={pendingDiaries} icon={Clock} variant="warning" />
          </div>

          {/* Super Admins */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-display">Super Admins</CardTitle>
              <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Super Admin</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Super Admin</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddAdmin} className="space-y-3">
                    <div><Label>Name *</Label><Input name="name" required /></div>
                    <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                    <div><Label>Phone Number *</Label><Input name="phone" placeholder="+91-" required /></div>
                    <div><Label>Password *</Label><Input name="password" type="password" required /></div>
                    <div><Label>Confirm Password *</Label><Input name="confirmPassword" type="password" required /></div>
                    <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Create Admin</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Created Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {superAdmins.map(sa => (
                      <TableRow key={sa.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{sa.name}</TableCell>
                        <TableCell>{sa.email}</TableCell>
                        <TableCell>{sa.phone || "—"}</TableCell>
                        <TableCell className="text-sm">{sa.createdDate || "—"}</TableCell>
                        <TableCell><StatusBadge status={sa.status || "active"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Doctors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-display">Doctors</CardTitle>
              <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-teal text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add Doctor</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Onboard New Doctor</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddDoctor} className="space-y-3">
                    <div><Label>Name *</Label><Input name="name" required /></div>
                    <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                    <div><Label>Phone Number *</Label><Input name="phone" placeholder="+91-" required /></div>
                    <div><Label>Hospital *</Label><Input name="hospital" required /></div>
                    <div><Label>Medical License Number *</Label><Input name="license" required /></div>
                    <div><Label>License Registration Number *</Label><Input name="licenseReg" required /></div>
                    <div><Label>Upload License Photo</Label><Input name="licensePhoto" type="file" accept=".jpg,.png,.pdf" className="cursor-pointer" /></div>
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
                    <TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Hospital</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>License</TableHead><TableHead>Specialization</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.slice(0, 10).map(d => (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.hospital}</TableCell>
                        <TableCell className="text-sm">{d.email}</TableCell>
                        <TableCell className="text-sm">{d.phone || "—"}</TableCell>
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
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Onboard New Vendor</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddVendor} className="space-y-3">
                    <div><Label>Vendor Name *</Label><Input name="name" required /></div>
                    <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                    <div><Label>Phone Number *</Label><Input name="phone" placeholder="+91-" required /></div>
                    <div><Label>Location *</Label><Input name="location" required /></div>
                    <div><Label>GST Details *</Label><Input name="gst" placeholder="22AAAAA0000A1Z5" required maxLength={15} /></div>
                    <div><Label>Bank Account Details</Label><Input name="bank" placeholder="Optional" /></div>
                    <div><Label>Commission Rate (₹)</Label><Input name="commission" type="number" defaultValue={50} /></div>
                    <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Submit</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Vendor ID</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>GST</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.slice(0, 10).map(v => (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="font-mono text-xs">{v.id}</TableCell>
                        <TableCell className="text-sm">{v.email || "—"}</TableCell>
                        <TableCell>{v.phone}</TableCell>
                        <TableCell className="font-mono text-xs">{v.gst || "—"}</TableCell>
                        <TableCell>{v.location}</TableCell>
                        <TableCell><StatusBadge status={v.status} /></TableCell>
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

  // ========== INVENTORY & APPROVALS ==========
  if (currentPage.includes("/inventory")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Super Admin">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Diary Activations</CardTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
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
        </div>
      </DashboardLayout>
    );
  }

  // ========== FINANCIALS ==========
  if (currentPage.includes("/financials")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Super Admin">
        <div className="space-y-6">
          {/* 6 Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Total Diaries" value={diaries.length} icon={BookOpen} />
            <StatCard title="Total Vendors" value={vendors.length} icon={Store} />
            <StatCard title="Active Diaries" value={activeDiaries} icon={BookOpen} variant="success" />
            <StatCard title="Pending Approval" value={pendingDiaries} icon={Clock} variant="warning" />
            <StatCard title="Completed" value={completedDiaries} icon={BookOpen} />
            <StatCard title="In Approval" value={pendingDiaries} icon={Clock} variant="warning" />
          </div>

          {/* 3 Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="h-6 w-6 text-success" />
                </div>
                <p className="text-3xl font-display font-bold">₹{(totalRevenue).toLocaleString("en-IN")}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Amount Received</p>
                <p className="text-xs text-muted-foreground">Total revenue from diary sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
                  <Percent className="h-6 w-6 text-warning" />
                </div>
                <p className="text-3xl font-display font-bold">₹{totalCommission.toLocaleString("en-IN")}</p>
                <p className="text-sm text-muted-foreground mt-1">Commission to Vendor</p>
                <p className="text-xs text-muted-foreground">Total vendor commissions (10%)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6 text-secondary" />
                </div>
                <p className="text-lg font-display font-bold mt-2">Statements</p>
                <Button variant="outline" className="mt-3" onClick={() => setStatementOpen(true)}>View Complete Statement</Button>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Wallets */}
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

          {/* Statement Modal */}
          <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Complete Financial Statement</DialogTitle></DialogHeader>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-success/10 rounded-lg"><p className="text-sm text-muted-foreground">Total In</p><p className="text-xl font-bold text-success">₹{totalRevenue.toLocaleString("en-IN")}</p></div>
                <div className="text-center p-3 bg-warning/10 rounded-lg"><p className="text-sm text-muted-foreground">Total Out</p><p className="text-xl font-bold text-warning">₹{totalCommission.toLocaleString("en-IN")}</p></div>
                <div className="text-center p-3 bg-secondary/10 rounded-lg"><p className="text-sm text-muted-foreground">Net Balance</p><p className="text-xl font-bold text-secondary">₹{(totalRevenue - totalCommission).toLocaleString("en-IN")}</p></div>
              </div>
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />PDF</Button>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Excel</Button>
              </div>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Diary ID</TableHead><TableHead>Amount</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {diaries.filter(d => d.status === "active").slice(0, 10).map(d => {
                      const vendor = vendors.find(v => v.id === d.vendorId);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="text-sm">{d.activationDate}</TableCell>
                          <TableCell>Sale</TableCell>
                          <TableCell className="font-mono text-xs">{d.id}</TableCell>
                          <TableCell>₹{d.salePrice}</TableCell>
                          <TableCell>{vendor?.name || "—"}</TableCell>
                          <TableCell><StatusBadge status="active" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    );
  }

  // ========== AUDIT ==========
  return (
    <DashboardLayout navItems={navItems} roleLabel="Super Admin">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Audit Logs</CardTitle>
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Role:</Label>
                <Select value={auditRoleFilter} onValueChange={setAuditRoleFilter}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="super admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Action:</Label>
                <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                  <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {auditActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Timestamp</TableHead><TableHead>Vendor</TableHead><TableHead>Doctor</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAuditLogs.map(l => (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{new Date(l.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{l.vendorName || "—"}</TableCell>
                      <TableCell className="text-sm">{l.doctorName || "—"}</TableCell>
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
      </div>
    </DashboardLayout>
  );
}
