import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import PageHeader from "@/components/common/PageHeader";
import {
  ShoppingBag, Wallet, TrendingUp, BookOpen, QrCode, CreditCard,
  Phone, UserCheck, CheckCircle2, ArrowRight, Search, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { label: "New Sale", path: "/vendor", icon: ShoppingBag },
  { label: "My Sales", path: "/vendor/sales", icon: TrendingUp },
];

export default function VendorDashboard() {
  const { doctors, patients, diaries } = useData();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [serialNumber, setSN] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [trainingDone, setTrainingDone] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [tab, setTab] = useState("sell");

  const vendorDiaries = diaries.filter(d => d.vendorId === "V001");
  const todaySales = vendorDiaries.filter(d => d.status === "active").length;

  const resetFlow = () => {
    setStep(1); setSN(""); setPaymentConfirmed(false); setOtpSent(false);
    setOtp(""); setSelectedDoctor(""); setTrainingDone(false); setSaleComplete(false);
  };

  const renderStep = () => {
    if (saleComplete) {
      return (
        <Card className="text-center py-10">
          <CardContent>
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Activation Complete!</h3>
            <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto text-left space-y-2 mt-4">
              <p className="text-sm"><span className="text-muted-foreground">Diary ID:</span> <span className="font-mono font-medium">{serialNumber || "DRY-2024-021"}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{doctors.find(d => d.id === selectedDoctor)?.name}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Commission:</span> <span className="font-semibold text-success">₹50</span></p>
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={resetFlow} className="gradient-teal text-primary-foreground">Sell Another Diary</Button>
              <Button variant="outline" onClick={() => setTab("sales")}>View My Sales</Button>
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
            {step === 2 && "Payment Collection"}
            {step === 3 && "Patient Registration"}
            {step === 4 && "Link Doctor"}
            {step === 5 && "Training Confirmation"}
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
              <div className="text-center py-4"><p className="text-muted-foreground">Diary Price</p><p className="text-4xl font-display font-bold">₹500</p></div>
              <div><Label>Amount Collected *</Label><Input type="number" placeholder="500" onChange={e => setPaymentConfirmed(e.target.value === "500")} /></div>
              {!paymentConfirmed && <p className="text-xs text-muted-foreground">Enter exactly ₹500 to proceed</p>}
              <Button onClick={() => setStep(3)} disabled={!paymentConfirmed} className="w-full gradient-teal text-primary-foreground">Confirm Payment <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </>
          )}

          {step === 3 && (
            <>
              <div><Label>Patient Mobile Number *</Label><Input placeholder="+91-XXXXXXXXXX" /></div>
              {!otpSent ? (
                <Button onClick={() => setOtpSent(true)} className="w-full" variant="outline"><Phone className="h-4 w-4 mr-1" />Send OTP</Button>
              ) : (
                <>
                  <div><Label>Enter OTP</Label><Input placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-2xl tracking-[0.5em] font-mono" /></div>
                  <Button onClick={() => setStep(4)} disabled={otp.length < 6} className="w-full gradient-teal text-primary-foreground">Verify OTP <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div><Label>Select Treating Doctor *</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger><SelectValue placeholder="Search by name or hospital" /></SelectTrigger>
                  <SelectContent>
                    {doctors.filter(d => d.status === "active").map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} — {d.hospital}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setStep(5)} disabled={!selectedDoctor} className="w-full gradient-teal text-primary-foreground">Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </>
          )}

          {step === 5 && (
            <>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Checkbox id="training" checked={trainingDone} onCheckedChange={v => setTrainingDone(v === true)} className="mt-0.5" />
                <label htmlFor="training" className="text-sm cursor-pointer"><span className="font-medium">Patient Training Completed</span><br /><span className="text-muted-foreground">Confirm patient knows how to use the diary app</span></label>
              </div>
              <Button onClick={() => { setSaleComplete(true); toast({ title: "Diary activated!", description: "Commission of ₹50 earned." }); }} disabled={!trainingDone} className="w-full gradient-teal text-primary-foreground text-lg py-6">
                <CheckCircle2 className="h-5 w-5 mr-2" />Complete Activation
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted"><TabsTrigger value="sell">Sell New Diary</TabsTrigger><TabsTrigger value="sales">My Sales</TabsTrigger></TabsList>

          <TabsContent value="sell" className="mt-4 max-w-xl">
            {renderStep()}
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">Sales History</CardTitle>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Diary ID</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Amount</TableHead><TableHead>Commission</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {vendorDiaries.map(d => {
                        const p = patients.find(pt => pt.id === d.patientId);
                        const doc = doctors.find(dc => dc.id === d.doctorId);
                        return (
                          <TableRow key={d.id} className="hover:bg-muted/30">
                            <TableCell className="text-xs">{d.activationDate}</TableCell>
                            <TableCell className="font-mono text-xs">{d.id}</TableCell>
                            <TableCell className="font-medium">{p?.name || "—"}</TableCell>
                            <TableCell>{doc?.name || "—"}</TableCell>
                            <TableCell>₹{d.salePrice}</TableCell>
                            <TableCell className="text-success font-medium">₹{d.vendorCommission}</TableCell>
                            <TableCell><StatusBadge status={d.status} /></TableCell>
                          </TableRow>
                        );
                      })}
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
