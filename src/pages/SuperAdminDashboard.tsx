import { useEffect, useState } from "react";
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
import axios from "axios";
import StaffStepperDialog from "@/components/ui/StaffStepperDialog";

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
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activationDiaryData, setActivationDiaryData] = useState<any>([]);
  const [vendorWalletData, setVendorWalletData] = useState<any>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustType, setAdjustType] = useState("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const currentPage = location.pathname;
  const handleAddDoctor = async (data: any) => {
    setSubmitting(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/api/v1/admin/create-staff`,
        {
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          hospital: data.hospital,
          specialization: data.specialization,
          role: "DOCTOR",
          bank: {
            accountHolder: data.accountHolder,
            accountNumber: data.accountNumber,
            ifsc: data.ifsc,
          },
          commissionType: data.commissionType,
          commissionRate: parseFloat(data.commissionRate),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Doctor Created Successfully",
        description: "Credentials sent to email. Cashfree vendor registered.",
      });
      setAddDoctorOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create doctor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${BASE_URL}/api/v1/dashboard/super-admin`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDashboardData(response.data.data);
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchSuperAdmins = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${BASE_URL}/api/v1/dashboard/getAllSuperAdmins`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuperAdmins(
          response.data.data.map((admin: any) => ({
            id: admin.id,
            role: "SUPER_ADMIN",
            name: admin.fullName,
            email: admin.email,
            phone: admin.phone, // backend not returning phone yet
            createdDate: new Date(admin.createdAt).toLocaleDateString(),
            status: "active",
          }))
        );
      } catch (error) {
        console.error("Error fetching super admins", error);
      }
    };

    fetchSuperAdmins();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${BASE_URL}/api/v1/doctors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const apiDoctors = response.data.data.doctors;

        setDoctors(
          apiDoctors.map((doc: any) => ({
            id: doc.id,
            role: "doctor",
            name: doc.fullName,
            email: doc.email,
            phone: doc.phone,
            hospital: doc.hospital,
            license: doc.license,
            specialization: doc.specialization,
            status: "active",
            totalPatients: doc.stats?.totalPatients || 0,
            totalAssistants: doc.stats?.totalAssistants || 0,
            createdDate: new Date(doc.createdAt).toLocaleDateString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching doctors", error);
      }
    };

    fetchDoctors();
  }, []);
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${BASE_URL}/api/v1/vendors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const apiVendors = response.data.data.data;

        setVendors(
          apiVendors.map((vendor: any) => ({
            id: vendor.id,
            role: "vendor",
            name: vendor.fullName,
            email: vendor.email,
            phone: vendor.phone,
            location: vendor.location, // not coming from API
            gst: vendor.GST, // not coming
            bankDetails: "",
            walletBalance: 0,
            diariesSold: 0,
            commissionRate: 0,
            status: vendor.isEmailVerified ? "active" : "pending",
            createdDate: new Date(vendor.createdAt).toLocaleDateString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching vendors", error);
      }
    };

    fetchVendors();
  }, []);

  const handleAddVendor = async (data: any) => {
    setSubmitting(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/api/v1/admin/create-staff`,
        {
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          gst: data.gst,
          role: "VENDOR",
          bank: {
            accountHolder: data.accountHolder,
            accountNumber: data.accountNumber,
            ifsc: data.ifsc,
          },
          commissionType: data.commissionType,
          commissionRate: parseFloat(data.commissionRate),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Vendor Created Successfully",
        description: "Credentials sent to email. Cashfree vendor registered.",
      });
      setAddVendorOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create vendor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };



  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    const password = fd.get("password") as string;
    const confirm = fd.get("confirmPassword") as string;

    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await axios.post(
        `${BASE_URL}/api/v1/auth/signup-super-admin`,
        {
          fullName: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password: password,
        }
      );

      toast({
        title: "Super Admin Created!",
        description: "Admin saved in database successfully.",
      });

      setAddAdminOpen(false);

      // Refetch list
      window.location.reload();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };


  const handleApproveDiary = async (id: string) => {
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");

      await axios.put(
        `${BASE_URL}/api/v1/diaries/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI after success
      setDiaries(prev =>
        prev.map(d =>
          d.id === id
            ? { ...d, status: "active", activationDate: new Date().toISOString() }
            : d
        )
      );

      toast({
        title: "Diary Approved",
        description: `${id} is now active`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve diary",
        variant: "destructive",
      });
    }
  };

  const handleRejectDiary = async (id: string) => {
    const reason = prompt("Enter rejection reason");

    if (!reason) {
      toast({
        title: "Rejection reason required",
        variant: "destructive",
      });
      return;
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");

      await axios.put(
        `${BASE_URL}/api/v1/diaries/${id}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDiaries(prev =>
        prev.map(d =>
          d.id === id
            ? { ...d, status: "rejected", rejectionReason: reason }
            : d
        )
      );

      toast({
        title: "Diary Rejected",
        description: `${id} rejected successfully`,
        variant: "destructive",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject diary",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    const fetchSoldDiaries = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${BASE_URL}/api/v1/diaries/sold`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Save diaries to context
        setActivationDiaryData(res.data.data.data);
      } catch (error) {
        console.error("Error fetching sold diaries", error);
      }
    };

    fetchSoldDiaries();
  }, []);
  useEffect(() => {
    const fetchVendorWallet = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${BASE_URL}/api/v1/wallets/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setVendorWalletData(res.data.data);

        // Save diaries to context
      } catch (error) {
        console.error("Error fetching sold diaries", error);
      }
    };

    fetchVendorWallet();
  }, []);
  const handleManualAdjust = async () => {
    if (adjustType === "DEBIT" && Number(adjustAmount) > selectedWallet.balance) {
      toast({
        title: "Insufficient Balance",
        description: "Cannot debit more than wallet balance",
        variant: "destructive",
      });
      return;
    }
    if (!adjustAmount || Number(adjustAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Enter valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdjustLoading(true);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/api/v1/wallets/${selectedWallet.vendor.id}/adjust`,
        {
          type: adjustType,
          amount: Number(adjustAmount),
          description: adjustDescription,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "Wallet Adjusted Successfully",
        description: `${adjustType} ₹${adjustAmount} applied`,
      });

      setAdjustDialogOpen(false);
      setAdjustAmount("");
      setAdjustDescription("");

      // Refresh wallet list
      const res = await axios.get(
        `${BASE_URL}/api/v1/wallets/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setVendorWalletData(res.data.data);

    } catch (error: any) {
      toast({
        title: "Adjustment Failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.hospital.toLowerCase().includes(search.toLowerCase()));
  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  );


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
            <StatCard title="Total Doctors" value={dashboardData?.users?.totalDoctors} icon={Users} />
            <StatCard title="Total Vendors" value={dashboardData?.users?.totalVendors} icon={Store} />
            <StatCard title="Active Diaries" value={dashboardData?.diaries?.activeDiaries} icon={BookOpen} variant="success" />
            <StatCard title="Pending Approvals" value={dashboardData?.diaries?.pendingApprovals} icon={Clock} variant="warning" />
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
              <StaffStepperDialog
                type="DOCTOR"
                open={addDoctorOpen}
                onOpenChange={setAddDoctorOpen}
                onSubmit={handleAddDoctor}
                isSubmitting={submitting}
              />
              <Button size="sm" className="gradient-teal text-primary-foreground" onClick={() => setAddDoctorOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Add Doctor
              </Button>
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
              <StaffStepperDialog
                type="VENDOR"
                open={addVendorOpen}
                onOpenChange={setAddVendorOpen}
                onSubmit={handleAddVendor}
                isSubmitting={submitting}
              />

              <Button size="sm" className="gradient-teal text-primary-foreground" onClick={() => setAddVendorOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Vendor ID</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>GST</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.slice(0, 10).map(v => {
                      return (
                        <TableRow key={v.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="font-mono text-xs">{v.id}</TableCell>
                          <TableCell className="text-sm">{v.email || "—"}</TableCell>
                          <TableCell>{v.phone}</TableCell>
                          <TableCell className="font-mono text-xs">{v?.GST || "—"}</TableCell>
                          <TableCell>{v.location}</TableCell>
                          <TableCell><StatusBadge status={v.status} /></TableCell>
                        </TableRow>
                      )
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
                    {activationDiaryData.map(d => {

                      return (
                        <TableRow key={d.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs">{d.id}</TableCell>
                          <TableCell>{d?.patient?.fullName || "—"}</TableCell>
                          <TableCell>{d?.vendor?.fullName || "—"}</TableCell>
                          <TableCell>{d?.doctor?.fullName || "—"}</TableCell>
                          <TableCell>{d?.createdAt.split("T")[0]}</TableCell>
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

          {/* 3 Financial Cards */}


          {/* Vendor Wallets */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Vendor Wallets</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Vendor</TableHead><TableHead>Balance</TableHead><TableHead>Total Credited</TableHead><TableHead>Total Debited</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vendorWalletData.map(v => (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {v?.vendor?.fullName}
                        </TableCell>

                        <TableCell className="font-semibold">
                          ₹{Number(v.balance).toLocaleString("en-IN")}
                        </TableCell>

                        <TableCell>
                          ₹{Number(v.totalCredited).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          ₹{Number(v.totalDebited).toLocaleString("en-IN")}
                        </TableCell>

                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedWallet(v);
                              setWalletDialogOpen(true);
                            }}
                          >
                            View Transactions
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedWallet(v);
                              setAdjustDialogOpen(true);
                            }}
                          >
                            Manual Adjust
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                </Table>
              </div>
            </CardContent>
          </Card>
          <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedWallet?.vendor?.fullName} - Wallet Details
                </DialogTitle>
              </DialogHeader>

              {selectedWallet && (
                <>
                  {/* Wallet Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-success/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-xl font-bold text-success">
                        ₹{Number(selectedWallet.balance).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total Credited</p>
                      <p className="text-xl font-bold text-primary">
                        ₹{Number(selectedWallet.totalCredited).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="p-4 bg-destructive/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total Debited</p>
                      <p className="text-xl font-bold text-destructive">
                        ₹{Number(selectedWallet.totalDebited).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dairy ID</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {selectedWallet.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedWallet.transactions.map((txn: any) => (
                            <TableRow key={txn.id}>
                              <TableCell className="text-sm">
                                {new Date(txn.createdAt).toLocaleString()}
                              </TableCell>

                              <TableCell>
                                <StatusBadge status={txn.type === "CREDIT" ? "CREDITED" : "DEBITED"} />
                              </TableCell>

                              <TableCell className="text-sm">
                                {txn.diaryId}
                              </TableCell>
                              <TableCell className="text-sm">
                                {txn.category}
                              </TableCell>

                              <TableCell className="font-semibold">
                                ₹{Number(txn.amount).toLocaleString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Manual Wallet Adjustment
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">

                <div>
                  <Label>Type</Label>
                  <Select value={adjustType} onValueChange={setAdjustType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT">Credit (Add Money)</SelectItem>
                      <SelectItem value="DEBIT">Debit (Deduct Money)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Reason for adjustment"
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                  />
                </div>

              </div>

              <DialogFooter>
                <Button
                  onClick={handleManualAdjust}
                  disabled={adjustLoading}
                  className="gradient-teal text-primary-foreground"
                >
                  {adjustLoading ? "Processing..." : "Confirm Adjustment"}
                </Button>
              </DialogFooter>
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
