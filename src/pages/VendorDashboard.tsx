import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  ShoppingBag, Wallet, TrendingUp, QrCode,
  Phone, CheckCircle2, ArrowRight, Download, UserPlus, Stethoscope,
  Eye, Receipt, IndianRupee, Package,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { DiaryType } from "@/data/mockData";
import StaffStepperDialog from "@/components/ui/StaffStepperDialog";
import axios from "axios";

const navItems = [
  { label: "New Sale", path: "/vendor", icon: ShoppingBag },
  { label: "Onboard Doctor", path: "/vendor/doctors", icon: Stethoscope },
  { label: "My Diaries", path: "/vendor/my-diaries", icon: Package },
  { label: "My Sales", path: "/vendor/sales", icon: TrendingUp },
];

const diaryTypeOptions: { value: DiaryType; label: string; icon: string }[] = [
  { value: "peri-operative", label: "Peri-Operative", icon: "⚕️" },
  { value: "post-operative", label: "Post-Operative", icon: "🏥" },
  { value: "follow-up", label: "Follow-up", icon: "📋" },
  { value: "chemotherapy", label: "Chemotherapy", icon: "💊" },
  { value: "radiology", label: "Radiology", icon: "☢️" },
];

export default function VendorDashboard() {
  const { doctors, setDoctors, patients, diaries } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const currentPage = location.pathname;

  // Sale flow state
  const [step, setStep] = useState(1);
  const [serialNumber, setSN] = useState("");
  const [diaryType, setDiaryType] = useState<DiaryType | "">("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);

  // Doctor onboarding
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [onboardedDoctors, setOnboardedDoctors] = useState<{ name: string; hospital: string; phone: string; status: string; date: string }[]>([]);

  // Sales filters
  const [salesDiaryTypeFilter, setSalesDiaryTypeFilter] = useState("all");
  const [statementOpen, setStatementOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false)
  const vendorDiaries = diaries.filter(d => d.vendorId === "V001");
  const todaySales = vendorDiaries.filter(d => d.status === "active").length;
  const totalSalesAmount = vendorDiaries.filter(d => d.status === "active").length * 500;

  const resetFlow = () => {
    setStep(1); setSN(""); setDiaryType(""); setPatientName(""); setPatientAge(""); setPatientGender("");
    setPatientPhone(""); setPatientAddress(""); setSelectedDoctor(""); setPaymentConfirmed(false); setSaleComplete(false);
  };

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
    const fetchDoctors = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${BASE_URL}/api/v1/doctors/getDoctorsByVendor`,
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
  // ========== NEW SALE ==========
  if (currentPage === "/vendor" || currentPage === "/vendor/") {
    const renderStep = () => {
      if (saleComplete) {
        return (
          <Card className="text-center py-10">
            <CardContent>
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Registration Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">Payment ₹500 sent to Super Admin. Your commission (₹50) will be credited after approval.</p>
              <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto text-left space-y-2 mt-4">
                <p className="text-sm"><span className="text-muted-foreground">Diary ID:</span> <span className="font-mono font-medium">{serialNumber || "DRY-2024-021"}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{patientName}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{doctors.find(d => d.id === selectedDoctor)?.name}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Diary Type:</span> <span className="font-medium capitalize">{diaryType}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Commission:</span> <span className="font-semibold text-success">₹50 (pending approval)</span></p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={resetFlow} className="gradient-teal text-primary-foreground">Register Another Patient</Button>
                <Button variant="outline" onClick={() => window.location.hash = ""}>View Sales History</Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`flex items-center gap-1 ${s <= step ? "text-secondary" : "text-muted-foreground/40"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${s === step ? "gradient-teal text-primary-foreground" : s < step ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{s < step ? "✓" : s}</div>
                  {s < 5 && <div className={`w-6 h-0.5 ${s < step ? "bg-success" : "bg-muted"}`} />}
                </div>
              ))}
            </div>
            <CardTitle className="text-lg font-display">
              {step === 1 && "Identify Diary"}
              {step === 2 && "Select Diary Type"}
              {step === 3 && "Patient Details"}
              {step === 4 && "Payment Collection"}
              {step === 5 && "Confirmation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <Tabs defaultValue="manual">
                  <TabsList><TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-1" />QR Scanner</TabsTrigger><TabsTrigger value="manual">Manual Entry</TabsTrigger></TabsList>
                  <TabsContent value="qr" className="mt-3">
                    <div className="bg-muted rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center"><QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Camera mock — use Manual Entry</p></div>
                    </div>
                  </TabsContent>
                  <TabsContent value="manual" className="mt-3">
                    <Label>Diary Serial Number</Label>
                    <Input placeholder="DRY-2024-XXXX" value={serialNumber} onChange={e => setSN(e.target.value)} className="text-lg" />
                  </TabsContent>
                </Tabs>
                <Button onClick={() => setStep(2)} disabled={!serialNumber} className="w-full gradient-teal text-primary-foreground">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground">Select the type of diary for this patient:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {diaryTypeOptions.map(dt => {
                    const isDisabled = dt.value === "follow-up" || dt.value === "chemotherapy" || dt.value === "radiology";
                    return (
                      <button
                        key={dt.value}
                        onClick={() => !isDisabled && setDiaryType(dt.value)}
                        disabled={isDisabled}
                        title={isDisabled ? "Available soon" : undefined}
                        className={`p-4 rounded-lg border-2 text-center transition-all relative ${isDisabled ? "opacity-50 cursor-not-allowed bg-muted border-border" : diaryType === dt.value ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50 cursor-pointer"}`}
                      >
                        <span className="text-2xl">{dt.icon}</span>
                        <p className="text-sm font-medium mt-1">{dt.label}</p>
                        {isDisabled ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted-foreground/20 text-muted-foreground rounded-full mt-1 inline-block">Coming Soon</span>
                        ) : (
                          <span className="text-[10px] text-success mt-1 inline-block">✅ Available</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Button onClick={() => setStep(3)} disabled={!diaryType || diaryType === "follow-up" || diaryType === "chemotherapy" || diaryType === "radiology"} className="w-full gradient-teal text-primary-foreground">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Patient Name *</Label><Input value={patientName} onChange={e => setPatientName(e.target.value)} required /></div>
                  <div><Label>Age *</Label><Input type="number" min={1} max={120} value={patientAge} onChange={e => setPatientAge(e.target.value)} required /></div>
                  <div><Label>Gender *</Label>
                    <Select value={patientGender} onValueChange={setPatientGender}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Mobile Number *</Label><Input placeholder="+91-" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} required /></div>
                </div>
                <div><Label>Address *</Label><Textarea value={patientAddress} onChange={e => setPatientAddress(e.target.value)} required /></div>
                <div><Label>Assigned Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger><SelectValue placeholder="Search by name or hospital" /></SelectTrigger>
                    <SelectContent>
                      {doctors.filter(d => d.status === "active").map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name} — {d.hospital}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setStep(4)} disabled={!patientName || !patientAge || !patientGender || !patientPhone || !patientAddress || !selectedDoctor} className="w-full gradient-teal text-primary-foreground">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}

            {step === 4 && (
              <>
                <div className="text-center py-4"><p className="text-muted-foreground">Diary Price</p><p className="text-4xl font-display font-bold">₹500</p></div>
                <div><Label>Amount Collected *</Label><Input type="number" placeholder="500" onChange={e => setPaymentConfirmed(e.target.value === "500")} /></div>
                {!paymentConfirmed && <p className="text-xs text-muted-foreground">Enter exactly ₹500 to proceed</p>}
                <Button onClick={() => setStep(5)} disabled={!paymentConfirmed} className="w-full gradient-teal text-primary-foreground">Confirm Payment <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}

            {step === 5 && (
              <>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold mb-2">Registration Summary</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Diary:</span> {serialNumber}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Type:</span> <span className="capitalize">{diaryType}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Patient:</span> {patientName}, {patientAge}y, {patientGender}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {patientPhone}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Doctor:</span> {doctors.find(d => d.id === selectedDoctor)?.name}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Amount:</span> ₹500</p>
                </div>
                <Button onClick={() => { setSaleComplete(true); toast({ title: "Registration submitted!", description: "Sent to Super Admin for approval." }); }} className="w-full gradient-teal text-primary-foreground text-lg py-6">
                  <CheckCircle2 className="h-5 w-5 mr-2" />Complete Registration & Send to Super Admin
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      );
    };

    return (
      <DashboardLayout navItems={navItems} roleLabel="Vendor">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Today's Sales" value={Math.min(todaySales, 3)} icon={ShoppingBag} />
            <StatCard title="This Month" value={todaySales} icon={TrendingUp} variant="success" />
            <StatCard title="Wallet Balance" value="₹2,500" icon={Wallet} />
          </div>
          <div className="max-w-xl">{renderStep()}</div>
        </div>
      </DashboardLayout>
    );
  }

  // ========== ONBOARD DOCTOR ==========
  if (currentPage.includes("/doctors")) {
    return (
      <DashboardLayout navItems={navItems} roleLabel="Vendor">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">Onboard Doctor</h2>
            {/* <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-teal text-primary-foreground"><UserPlus className="h-4 w-4 mr-1" />Add New Doctor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Onboard New Doctor</DialogTitle></DialogHeader>
                <form onSubmit={handleOnboardDoctor} className="space-y-3">
                  <div><Label>Name *</Label><Input name="name" required /></div>
                  <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                  <div><Label>Phone Number *</Label><Input name="phone" placeholder="+91-" required /></div>
                  <div><Label>Hospital Name *</Label><Input name="hospital" required /></div>
                  <div><Label>Medical License Number *</Label><Input name="license" required /></div>
                  <div><Label>License Registration Number *</Label><Input name="licenseReg" required /></div>
                  <div><Label>Upload License Photo</Label><Input name="licensePhoto" type="file" accept=".jpg,.png,.pdf" className="cursor-pointer" /></div>
                  <DialogFooter><Button type="submit" className="gradient-teal text-primary-foreground">Submit for Approval</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog> */}
            <StaffStepperDialog
              type="DOCTOR"
              open={addDoctorOpen}
              onOpenChange={setAddDoctorOpen}
              onSubmit={handleAddDoctor}
              isSubmitting={submitting}
            />
            <Button className="gradient-teal text-primary-foreground" onClick={() => setAddDoctorOpen(true)}><UserPlus className="h-4 w-4 mr-1" />Add New Doctor</Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg font-display">My Onboarded Doctors</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Hospital</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Date Added</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {onboardedDoctors.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No doctors onboarded yet. Click "Add New Doctor" to get started.</TableCell></TableRow>
                    ) : onboardedDoctors.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.hospital}</TableCell>
                        <TableCell>{d.phone}</TableCell>
                        <TableCell><StatusBadge status={d.status === "Pending" ? "pending" : "active"} /></TableCell>
                        <TableCell>{d.date}</TableCell>
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

  // ========== MY SALES ==========
  const filteredSales = salesDiaryTypeFilter === "all"
    ? vendorDiaries
    : vendorDiaries.filter(d => d.diaryType === salesDiaryTypeFilter);

  return (
    <DashboardLayout navItems={navItems} roleLabel="Vendor">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Sales" value={`₹${totalSalesAmount.toLocaleString()}`} icon={IndianRupee} />
          <Card className="cursor-pointer hover:shadow-clinical-md transition-shadow" onClick={() => setStatementOpen(true)}>
            <CardContent className="pt-6 text-center">
              <Receipt className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">Statement</p>
              <p className="text-xs text-muted-foreground">View transaction history</p>
            </CardContent>
          </Card>
          <StatCard title="Wallet Balance" value="₹2,500" icon={Wallet} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Sales History</CardTitle>
            <div className="flex gap-2">
              <Select value={salesDiaryTypeFilter} onValueChange={setSalesDiaryTypeFilter}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Diary Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {diaryTypeOptions.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />PDF</Button>
              <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Excel</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead><TableHead>Diary ID</TableHead><TableHead>Patient</TableHead><TableHead>Patient Details</TableHead><TableHead>Doctor</TableHead><TableHead>Diary Type</TableHead><TableHead>Payment</TableHead><TableHead>Sent to Admin</TableHead><TableHead>Commission</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(d => {
                    const p = patients.find(pt => pt.id === d.patientId);
                    const doc = doctors.find(dc => dc.id === d.doctorId);
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs">{d.activationDate}</TableCell>
                        <TableCell className="font-mono text-xs">{d.id}</TableCell>
                        <TableCell className="font-medium">{p?.name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p ? `${p.age}y, ${p.gender}, ${p.phone}` : "—"}</TableCell>
                        <TableCell>{doc?.name || "—"}</TableCell>
                        <TableCell><span className="capitalize text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">{d.diaryType || "—"}</span></TableCell>
                        <TableCell>₹{d.salePrice}</TableCell>
                        <TableCell>₹{d.salePrice}</TableCell>
                        <TableCell>
                          {d.status === "active" ? (
                            <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full font-medium">Received</span>
                          ) : d.status === "pending" ? (
                            <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full font-medium">Pending</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium">Rejected</span>
                          )}
                        </TableCell>
                        <TableCell><Button size="sm" variant="ghost" className="h-7"><Eye className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Statement Modal */}
        <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Transaction History</DialogTitle></DialogHeader>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Diary ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vendorDiaries.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{d.activationDate}</TableCell>
                      <TableCell>Sale</TableCell>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell>₹{d.salePrice}</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
