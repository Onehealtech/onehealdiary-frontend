import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import StatusBadge from "@/components/common/StatusBadge";
import QRCode from "react-qr-code";
import {
  Users, BookOpen, CreditCard, ClipboardList, Package, Plus, Search, Download, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { DiaryType, DiaryTypeCode, GeneratedDiary, InventoryDiaryStatus } from "@/data/mockData";
import axios from "axios";

const navItems = [
  { label: "User Management", path: "/super-admin", icon: Users },
  { label: "Diary Inventory", path: "/super-admin/diary-inventory", icon: Package },
  { label: "Inventory & Approvals", path: "/super-admin/inventory", icon: BookOpen },
  { label: "Financials", path: "/super-admin/financials", icon: CreditCard },
  { label: "Compliance Audit", path: "/super-admin/audit", icon: ClipboardList },
];

const diaryTypeMap: Record<string, { label: string; code: DiaryTypeCode; enabled: boolean }> = {
  "peri-operative": { label: "Peri-Operative", code: "PO", enabled: true },
  "post-operative": { label: "Post-Operative", code: "OP", enabled: true },
  "follow-up": { label: "Follow-up", code: "FU", enabled: false },
  "chemotherapy": { label: "Chemotherapy", code: "CH", enabled: false },
  "radiology": { label: "Radiology", code: "RA", enabled: false },
};

const quantityOptions = [10, 25, 50, 100];

export default function SuperAdminDiaryInventory() {
  const { vendors, generatedDiaries, setGeneratedDiaries, notifications, setVendors, setNotifications, diaryRequests, setDiaryRequests } = useData();
  const { toast } = useToast();
  console.log(generatedDiaries, "generatedDiaries");

  const [selectedType, setSelectedType] = useState<DiaryType | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [customQty, setCustomQty] = useState("");
  const [lastGenerated, setLastGenerated] = useState<GeneratedDiary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVendor, setBulkVendor] = useState("");
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [searchId, setSearchId] = useState("");
  const [requestDiary, setRequestDiary] = useState<any[]>([])
  // Request modal
  const [requestModal, setRequestModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModal, setRejectModal] = useState<string | null>(null);

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
  const activeVendors = vendors.filter(v => v.status === "active");

  const getNextSeq = (typeCode: DiaryTypeCode) => {
    const existing = generatedDiaries.filter(d => d.typeCode === typeCode);
    return existing.length + 1;
  };

  const handleGenerate = async () => {
    if (!selectedType) return;

    const qty = quantity === "custom" ? Number(customQty) : Number(quantity);
    if (!qty || qty < 1 || qty > 500) {
      toast({ title: "Invalid quantity", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("token"); // adjust if stored elsewhere

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/generated-diaries/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: qty,
            diaryType: selectedType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate diaries");
      }

      // assuming backend returns generated diaries array


      toast({
        title: "Diaries generated successfully",
        description: `${qty} diaries created`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchGeneratedDiaries = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/generated-diaries?status=unassigned`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      console.log(data, "data");
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch diaries");
      }

      // IMPORTANT: adjust based on backend structure
      setGeneratedDiaries(data.data.data);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchGeneratedDiaries();
  }, []);
  const handleAssignSingle = async (diaryId: string, vendorId: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/generated-diaries/${diaryId}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vendorId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to assign diary");
      }

      toast({
        title: "Diary assigned successfully",
      });

      // Refresh from DB
      await fetchGeneratedDiaries();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleBulkAssign = async () => {
    if (!bulkVendor || selectedIds.size === 0) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/generated-diaries/bulk-assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            diaryIds: Array.from(selectedIds),
            vendorId: bulkVendor,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Bulk assign failed");
      }

      toast({
        title: `Assigned ${selectedIds.size} diaries successfully`,
      });

      setSelectedIds(new Set());
      setBulkVendor("");

      // Refresh from DB
      await fetchGeneratedDiaries();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unassigned = generatedDiaries.filter(d => d.status === "unassigned");
    if (selectedIds.size === unassigned.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unassigned.map(d => d.id)));
    }
  };

  // Handle request approval
  const currentRequest = requestDiary.find(r => r.id === requestModal);
  useEffect(() => {
    const fetchRequestDiary = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/sp/diary-requests?status=pending`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        console.log(data, "data");
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch diaries");
        }

        // IMPORTANT: adjust based on backend structure
        setRequestDiary(data.data.data);

      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRequestDiary();
  }, [])
  const refreshRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/sp/diary-requests?status=pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setRequestDiary(data.data.data);

    } catch (error) {
      console.error("Failed to refresh requests");
    }
  };

  const handleApproveRequest = async () => {
    if (!requestModal) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/diary-requests/${requestModal}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to approve request");
      }

      toast({
        title: "Request Approved",
        description: "Diaries generated and assigned successfully",
      });

      setRequestModal(null);
      await refreshRequests(); // we’ll create this below

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast({
        title: "Reject reason required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/diary-requests/${rejectModal}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: rejectReason,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Reject failed");
      }

      toast({
        title: "Request Rejected",
        description: "Vendor has been notified",
        variant: "destructive",
      });

      setRejectModal(null);
      setRejectReason("");
      await refreshRequests();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  // Inventory table filters
  // const allDiaries = generatedDiaries
  //   .filter(d => filterType === "all" || d.type === filterType)
  //   .filter(d => filterStatus === "all" || d.status === filterStatus)
  //   .filter(d => filterVendor === "all" || d.assignedVendorId === filterVendor)
  //   .filter(d => !searchId || d.id.toLowerCase().includes(searchId.toLowerCase()));

  const pendingRequests = diaryRequests.filter(r => r.status === "pending");

  const statusColors: Record<InventoryDiaryStatus, string> = {
    unassigned: "bg-warning/15 text-warning border-warning/30",
    assigned: "bg-success/15 text-success border-success/30",
    active: "bg-info/15 text-info-foreground border-info/30",
    inactive: "bg-muted text-muted-foreground border-border",
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="Super Admin">
      <div className="space-y-8">
        <h1 className="text-2xl font-display font-bold">Generate & Manage Diary IDs</h1>

        {/* Pending Requests Banner */}
        {requestDiary.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <p className="font-semibold text-sm mb-2">📋 {requestDiary.length} Pending Diary Request(s)</p>
              <div className="space-y-2">
                {requestDiary.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-card rounded-lg p-3 border">
                    <div>
                      <p className="text-sm font-medium">{r.vendor.fullName} — {r.quantity} {diaryTypeMap[r.diaryType]?.label} diaries</p>
                      <p className="text-xs text-muted-foreground">{r.requestDate}{r.message ? ` • "${r.message}"` : ""}</p>
                    </div>
                    <Button size="sm" onClick={() => setRequestModal(r.id)} className="gradient-teal text-primary-foreground">Review</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: Generate */}
        <Card className="max-w-[600px] mx-auto">
          <CardHeader><CardTitle className="text-lg font-display">Generate New Diaries</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Diary Type</Label>
              <Select value={selectedType} onValueChange={v => setSelectedType(v as DiaryType)}>
                <SelectTrigger><SelectValue placeholder="Choose type..." /></SelectTrigger>
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
              <Label>Select Quantity</Label>
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger><SelectValue placeholder="Choose quantity..." /></SelectTrigger>
                <SelectContent>
                  {quantityOptions.map(q => <SelectItem key={q} value={String(q)}>{q}</SelectItem>)}
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {quantity === "custom" && (
                <Input type="number" min={1} max={500} placeholder="Enter quantity (1-500)" value={customQty} onChange={e => setCustomQty(e.target.value)} className="mt-2" />
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedType || !quantity || (quantity === "custom" && (!customQty || Number(customQty) < 1))}
              className="w-full gradient-teal text-primary-foreground text-base py-5"
            >
              <Plus className="h-5 w-5 mr-2" /> Generate Diary IDs
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 2: Display Generated */}
        {generatedDiaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">✅ {generatedDiaries.length} diaries generated</CardTitle>
              {/* Bulk actions */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedIds.size > 0 && selectedIds.size === generatedDiaries.filter(d => d.status === "unassigned").length} onCheckedChange={toggleSelectAll} />
                  <span className="text-sm">Select All Unassigned</span>
                </div>
                <Select value={bulkVendor} onValueChange={setBulkVendor}>
                  <SelectTrigger className="w-52 h-8"><SelectValue placeholder="Bulk assign to vendor..." /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name} — {v.location}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkAssign} disabled={!bulkVendor || selectedIds.size === 0}>Assign Selected ({selectedIds.size})</Button>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "Download started", description: "QR codes ZIP would download here." })}><Download className="h-4 w-4 mr-1" />Download All QRs</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-1">
                {generatedDiaries.map(diary => (
                  <AccordionItem key={diary.id} value={diary.id} className="border rounded-lg px-3">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {diary.status === "unassigned" && (
                          <Checkbox
                            checked={selectedIds.has(diary.id)}
                            onCheckedChange={() => toggleSelect(diary.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                        <span className="font-mono font-bold text-sm">{diary.id}</span>
                        <Badge variant="secondary" className="capitalize text-xs">{diaryTypeMap[diary.diaryType]?.label}</Badge>
                        <Badge variant="outline" className={`text-xs capitalize ${statusColors[diary.status]}`}>{diary.status}</Badge>
                        {diary.assignedVendorId && (
                          <span className="text-xs text-muted-foreground">→ {vendors.find(v => v.id === diary.assignedVendorId)?.name}</span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col sm:flex-row gap-6 py-2">
                        <div className="flex flex-col items-center gap-2">
                          <div className="bg-white p-3 rounded-lg border">
                            <QRCode value={diary.id} size={150} />
                          </div>
                          <Button size="sm" variant="outline" onClick={() => toast({ title: "QR Downloaded", description: diary.id })}>
                            <Download className="h-3 w-3 mr-1" /> Download QR
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm flex-1">
                          <p><span className="text-muted-foreground">Diary ID:</span> <span className="font-mono font-medium">{diary.id}</span></p>
                          <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{diary.diaryType}</span></p>
                          <p><span className="text-muted-foreground">Generated:</span> {new Date(diary.generatedDate).toLocaleString()}</p>
                          <p><span className="text-muted-foreground">Status:</span> <span className="capitalize">{diary.status}</span></p>
                          {diary.status === "unassigned" && (
                            <div className="flex items-center gap-2 mt-3">
                              <AssignDropdown vendors={vendors} onAssign={(vendorId) => handleAssignSingle(diary.id, vendorId)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
        {/* Reject Reason Modal */}
        <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Diary Request</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Label>Reason for rejection</Label>
              <Input
                placeholder="Enter reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
              >
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SECTION 3: All Diaries Inventory Table */}
        {generatedDiaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">All Generated Diaries ({generatedDiaries.length})</CardTitle>
              <div className="flex flex-wrap gap-3 mt-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(diaryTypeMap).filter(([, v]) => v.enabled).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search Diary ID..." className="h-8 pl-8 w-48" value={searchId} onChange={e => setSearchId(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "Inventory exported" })}><Download className="h-4 w-4 mr-1" />Download Inventory</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Diary ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedDiaries.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No diaries match filters</TableCell></TableRow>
                    ) : generatedDiaries.map(d => (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-medium">{d.id}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize text-xs">{diaryTypeMap[d.diaryType]?.label}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(d.generatedDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusColors[d.status]}`}>{d.status}</Badge></TableCell>
                        <TableCell className="text-sm">{d.assignedVendorId ? vendors.find(v => v.id === d.assignedVendorId)?.name : "Not Assigned"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast({ title: "QR Preview", description: d.id })}>View QR</Button>
                            {d.status !== "active" && d.assignedVendorId && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                setGeneratedDiaries(prev => prev.map(gd => gd.id === d.id ? { ...gd, assignedVendorId: undefined, status: "unassigned" as const } : gd));
                                toast({ title: "Diary unassigned" });
                              }}>Reassign</Button>
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
        )}

        {/* Request Approval Modal */}
        <Dialog open={!!requestModal} onOpenChange={() => setRequestModal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Diary Request Details</DialogTitle></DialogHeader>
            {currentRequest && (
              <div className="space-y-3">
                <p className="text-sm"><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{currentRequest.vendor.fullName} ({currentRequest.vendorId})</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Diary Type:</span> <span className="capitalize font-medium">{currentRequest.dairyType}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Quantity:</span> <span className="font-bold">{currentRequest.quantity}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Request Date:</span> {currentRequest.requestDate.split('T')[0]}</p>
                {currentRequest.message && <p className="text-sm"><span className="text-muted-foreground">Message:</span> "{currentRequest.message}"</p>}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setRejectModal(requestModal);
                setRequestModal(null);
              }}><X className="h-4 w-4 mr-1" />Reject</Button>
              <Button onClick={handleApproveRequest} className="gradient-teal text-primary-foreground"><Check className="h-4 w-4 mr-1" />Generate & Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Small helper component for inline vendor assignment
function AssignDropdown({ vendors, onAssign }: { vendors: { id: string; name: string; location: string }[]; onAssign: (id: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Select value={val} onValueChange={setVal}>
        <SelectTrigger className="h-8 w-48"><SelectValue placeholder="Assign to vendor..." /></SelectTrigger>
        <SelectContent>
          {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name} — {v.location}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!val} onClick={() => onAssign(val)}>Assign</Button>
    </div>
  );
}
