import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatCard from "@/components/common/StatCard";
import QRCode from "react-qr-code";
import {
  ShoppingBag, Wallet, TrendingUp, Package, Search, Download, Send, Eye, Stethoscope, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { DiaryType } from "@/data/mockData";

const navItems = [
  { label: "New Sale", path: "/vendor", icon: ShoppingBag },
  { label: "Onboard Doctor", path: "/vendor/doctors", icon: Stethoscope },
  { label: "My Diaries", path: "/vendor/my-diaries", icon: Package },
  { label: "My Sales", path: "/vendor/sales", icon: TrendingUp },
];

const diaryTypeMap: Record<string, { label: string; enabled: boolean }> = {
  "peri-operative": { label: "Peri-Operative", enabled: true },
  "post-operative": { label: "Post-Operative", enabled: true },
  "follow-up": { label: "Follow-up", enabled: false },
  "chemotherapy": { label: "Chemotherapy", enabled: false },
  "radiology": { label: "Radiology", enabled: false },
};

export default function VendorMyDiaries() {
  const { generatedDiaries, diaryRequests, setDiaryRequests, setNotifications } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const vendorId = "V001"; // Mock current vendor
  const myDiaries = generatedDiaries.filter(d => d.assignedVendorId === vendorId);
  const myRequests = diaryRequests.filter(r => r.vendorId === vendorId);

  const totalAssigned = myDiaries.length;
  const used = myDiaries.filter(d => d.status === "active").length;
  const available = myDiaries.filter(d => d.status === "assigned").length;
  const requested = myRequests.filter(r => r.status === "pending").length;

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchId, setSearchId] = useState("");

  // Request form
  const [reqType, setReqType] = useState<DiaryType | "">("");
  const [reqQty, setReqQty] = useState("");
  const [reqMsg, setReqMsg] = useState("");

  const filteredDiaries = myDiaries
    .filter(d => filterType === "all" || d.type === filterType)
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => !searchId || d.id.toLowerCase().includes(searchId.toLowerCase()));

  const handleRequestSubmit = () => {
    if (!reqType || !reqQty || Number(reqQty) < 1) return;
    const newReq = {
      id: `REQ-${Date.now()}`,
      vendorId,
      vendorName: "Rajesh Medical Store",
      type: reqType,
      quantity: Number(reqQty),
      message: reqMsg || undefined,
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending" as const,
    };
    setDiaryRequests(prev => [...prev, newReq]);
    // Notify admin
    setNotifications(prev => [...prev, {
      id: `N-REQ-${Date.now()}`,
      userId: "SA001",
      type: "info" as const,
      severity: "medium" as const,
      message: `📦 New diary request from Rajesh Medical Store - ${reqQty} ${diaryTypeMap[reqType]?.label} diaries`,
      timestamp: new Date().toISOString(),
      read: false,
    }]);
    toast({ title: "Request sent to Super Admin" });
    setReqType("");
    setReqQty("");
    setReqMsg("");
  };

  const statusColors: Record<string, string> = {
    assigned: "bg-success/15 text-success border-success/30",
    active: "bg-info/15 text-info-foreground border-info/30",
    inactive: "bg-muted text-muted-foreground border-border",
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="Vendor">
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">My Diaries</h1>

        {/* SECTION 1: Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Assigned" value={totalAssigned} icon={Package} />
          <StatCard title="Used" value={used} icon={ShoppingBag} />
          <StatCard title="Available" value={available} icon={Package} variant="success" />
          <StatCard title="Requested" value={requested} icon={Clock} variant="warning" />
        </div>

        {/* SECTION 2: My Assigned Diaries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Assigned Diaries</CardTitle>
            <div className="flex flex-wrap gap-3 mt-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(diaryTypeMap).filter(([,v]) => v.enabled).map(([k,v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Available</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search ID..." className="h-8 pl-8 w-44" value={searchId} onChange={e => setSearchId(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Diary ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiaries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No diaries assigned yet. Request diaries from Super Admin below.</TableCell></TableRow>
                  ) : filteredDiaries.map(d => (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-medium">{d.id}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-xs">{diaryTypeMap[d.type]?.label}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(d.generatedDate).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusColors[d.status] || ""}`}>{d.status === "assigned" ? "Available" : d.status}</Badge></TableCell>
                      <TableCell className="text-sm">{d.patientName || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" />QR</Button>
                          {d.status === "assigned" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/vendor?diaryId=${d.id}`)}>
                              Sell Diary
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Request Form */}
        <Card className="max-w-[600px]">
          <CardHeader><CardTitle className="text-lg font-display">Request Diaries from Super Admin</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Diary Type</Label>
              <Select value={reqType} onValueChange={v => setReqType(v as DiaryType)}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(diaryTypeMap).map(([key, val]) => (
                    <SelectItem key={key} value={key} disabled={!val.enabled}>
                      <span className="flex items-center gap-2">
                        {val.label}
                        {!val.enabled && <Badge variant="secondary" className="text-[10px] ml-1 opacity-60">Coming Soon</Badge>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity Needed</Label>
              <Input type="number" min={1} max={500} placeholder="Enter quantity..." value={reqQty} onChange={e => setReqQty(e.target.value)} />
            </div>
            <div>
              <Label>Message to Admin (Optional)</Label>
              <Textarea placeholder="Reason for request..." value={reqMsg} onChange={e => setReqMsg(e.target.value)} />
            </div>
            <Button onClick={handleRequestSubmit} disabled={!reqType || !reqQty || Number(reqQty) < 1} className="w-full gradient-teal text-primary-foreground">
              <Send className="h-4 w-4 mr-2" /> Submit Request
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 4: Request History */}
        {myRequests.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Request History</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Request Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fulfilled Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm">{r.requestDate}</TableCell>
                        <TableCell className="capitalize text-sm">{r.type}</TableCell>
                        <TableCell className="font-medium">{r.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs capitalize ${
                            r.status === "pending" ? "bg-warning/15 text-warning border-warning/30" :
                            r.status === "fulfilled" ? "bg-success/15 text-success border-success/30" :
                            "bg-destructive/15 text-destructive border-destructive/30"
                          }`}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.fulfilledDate || "—"}</TableCell>
                        <TableCell>
                          {r.status === "pending" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => {
                              setDiaryRequests(prev => prev.filter(req => req.id !== r.id));
                              toast({ title: "Request cancelled" });
                            }}>Cancel</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
