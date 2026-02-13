import { useState } from "react";
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
  const { vendors, generatedDiaries, setGeneratedDiaries, notifications, setNotifications, diaryRequests, setDiaryRequests } = useData();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<DiaryType | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [customQty, setCustomQty] = useState("");
  const [lastGenerated, setLastGenerated] = useState<GeneratedDiary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVendor, setBulkVendor] = useState("");

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [searchId, setSearchId] = useState("");

  // Request modal
  const [requestModal, setRequestModal] = useState<string | null>(null);

  const activeVendors = vendors.filter(v => v.status === "active");

  const getNextSeq = (typeCode: DiaryTypeCode) => {
    const existing = generatedDiaries.filter(d => d.typeCode === typeCode);
    return existing.length + 1;
  };

  const handleGenerate = () => {
    if (!selectedType) return;
    const info = diaryTypeMap[selectedType];
    const qty = quantity === "custom" ? Number(customQty) : Number(quantity);
    if (!qty || qty < 1 || qty > 500) return;

    const startSeq = getNextSeq(info.code);
    const year = new Date().getFullYear();
    const newDiaries: GeneratedDiary[] = [];
    for (let i = 0; i < qty; i++) {
      const seq = String(startSeq + i).padStart(3, "0");
      newDiaries.push({
        id: `DRY-${year}-${info.code}-${seq}`,
        type: selectedType,
        typeCode: info.code,
        generatedDate: new Date().toISOString(),
        status: "unassigned",
      });
    }
    setGeneratedDiaries(prev => [...prev, ...newDiaries]);
    setLastGenerated(newDiaries);
    setSelectedIds(new Set());
    toast({ title: `✅ Successfully generated ${qty} ${info.label} diary IDs` });
  };

  const handleAssignSingle = (diaryId: string, vendorId: string) => {
    setGeneratedDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, status: "assigned" as const, assignedVendorId: vendorId } : d));
    setLastGenerated(prev => prev.map(d => d.id === diaryId ? { ...d, status: "assigned" as const, assignedVendorId: vendorId } : d));
    const vendor = vendors.find(v => v.id === vendorId);
    toast({ title: "Diary assigned", description: `${diaryId} → ${vendor?.name}` });
    // Notify vendor
    setNotifications(prev => [...prev, {
      id: `N-INV-${Date.now()}`,
      userId: vendorId,
      type: "info" as const,
      severity: "medium" as const,
      message: `📦 You received 1 diary from Admin: ${diaryId}`,
      timestamp: new Date().toISOString(),
      read: false,
    }]);
  };

  const handleBulkAssign = () => {
    if (!bulkVendor || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setGeneratedDiaries(prev => prev.map(d => ids.includes(d.id) ? { ...d, status: "assigned" as const, assignedVendorId: bulkVendor } : d));
    setLastGenerated(prev => prev.map(d => ids.includes(d.id) ? { ...d, status: "assigned" as const, assignedVendorId: bulkVendor } : d));
    const vendor = vendors.find(v => v.id === bulkVendor);
    setNotifications(prev => [...prev, {
      id: `N-INV-BULK-${Date.now()}`,
      userId: bulkVendor,
      type: "info" as const,
      severity: "medium" as const,
      message: `📦 You received ${ids.length} diaries from Admin`,
      timestamp: new Date().toISOString(),
      read: false,
    }]);
    toast({ title: `Assigned ${ids.length} diaries to ${vendor?.name}` });
    setSelectedIds(new Set());
    setBulkVendor("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unassigned = lastGenerated.filter(d => d.status === "unassigned");
    if (selectedIds.size === unassigned.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unassigned.map(d => d.id)));
    }
  };

  // Handle request approval
  const currentRequest = diaryRequests.find(r => r.id === requestModal);
  const handleApproveRequest = () => {
    if (!currentRequest) return;
    const info = diaryTypeMap[currentRequest.type];
    const startSeq = getNextSeq(info.code);
    const year = new Date().getFullYear();
    const newDiaries: GeneratedDiary[] = [];
    for (let i = 0; i < currentRequest.quantity; i++) {
      const seq = String(startSeq + i).padStart(3, "0");
      newDiaries.push({
        id: `DRY-${year}-${info.code}-${seq}`,
        type: currentRequest.type,
        typeCode: info.code,
        generatedDate: new Date().toISOString(),
        status: "assigned",
        assignedVendorId: currentRequest.vendorId,
      });
    }
    setGeneratedDiaries(prev => [...prev, ...newDiaries]);
    setDiaryRequests(prev => prev.map(r => r.id === currentRequest.id ? { ...r, status: "fulfilled" as const, fulfilledDate: new Date().toISOString().split("T")[0], assignedDiaryIds: newDiaries.map(d => d.id) } : r));
    setNotifications(prev => [...prev, {
      id: `N-REQ-${Date.now()}`,
      userId: currentRequest.vendorId,
      type: "info" as const,
      severity: "medium" as const,
      message: `📦 You received ${currentRequest.quantity} ${info.label} diaries from Admin`,
      timestamp: new Date().toISOString(),
      read: false,
    }]);
    toast({ title: "Request fulfilled!", description: `Generated and assigned ${currentRequest.quantity} diaries to ${currentRequest.vendorName}` });
    setRequestModal(null);
  };

  const handleRejectRequest = () => {
    if (!currentRequest) return;
    setDiaryRequests(prev => prev.map(r => r.id === currentRequest.id ? { ...r, status: "rejected" as const } : r));
    setRequestModal(null);
    toast({ title: "Request rejected", variant: "destructive" });
  };

  // Inventory table filters
  const allDiaries = generatedDiaries
    .filter(d => filterType === "all" || d.type === filterType)
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => filterVendor === "all" || d.assignedVendorId === filterVendor)
    .filter(d => !searchId || d.id.toLowerCase().includes(searchId.toLowerCase()));

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
        {pendingRequests.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <p className="font-semibold text-sm mb-2">📋 {pendingRequests.length} Pending Diary Request(s)</p>
              <div className="space-y-2">
                {pendingRequests.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-card rounded-lg p-3 border">
                    <div>
                      <p className="text-sm font-medium">{r.vendorName} — {r.quantity} {diaryTypeMap[r.type]?.label} diaries</p>
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
        {lastGenerated.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">✅ {lastGenerated.length} diaries generated</CardTitle>
              {/* Bulk actions */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedIds.size > 0 && selectedIds.size === lastGenerated.filter(d => d.status === "unassigned").length} onCheckedChange={toggleSelectAll} />
                  <span className="text-sm">Select All Unassigned</span>
                </div>
                <Select value={bulkVendor} onValueChange={setBulkVendor}>
                  <SelectTrigger className="w-52 h-8"><SelectValue placeholder="Bulk assign to vendor..." /></SelectTrigger>
                  <SelectContent>
                    {activeVendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name} — {v.location}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkAssign} disabled={!bulkVendor || selectedIds.size === 0}>Assign Selected ({selectedIds.size})</Button>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "Download started", description: "QR codes ZIP would download here." })}><Download className="h-4 w-4 mr-1" />Download All QRs</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-1">
                {lastGenerated.map(diary => (
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
                        <Badge variant="secondary" className="capitalize text-xs">{diaryTypeMap[diary.type]?.label}</Badge>
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
                          <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{diary.type}</span></p>
                          <p><span className="text-muted-foreground">Generated:</span> {new Date(diary.generatedDate).toLocaleString()}</p>
                          <p><span className="text-muted-foreground">Status:</span> <span className="capitalize">{diary.status}</span></p>
                          {diary.status === "unassigned" && (
                            <div className="flex items-center gap-2 mt-3">
                              <AssignDropdown vendors={activeVendors} onAssign={(vendorId) => handleAssignSingle(diary.id, vendorId)} />
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
                    {Object.entries(diaryTypeMap).filter(([,v]) => v.enabled).map(([k,v]) => (
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
                    {activeVendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
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
                    {allDiaries.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No diaries match filters</TableCell></TableRow>
                    ) : allDiaries.map(d => (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-medium">{d.id}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize text-xs">{diaryTypeMap[d.type]?.label}</Badge></TableCell>
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
                <p className="text-sm"><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{currentRequest.vendorName} ({currentRequest.vendorId})</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Diary Type:</span> <span className="capitalize font-medium">{currentRequest.type}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Quantity:</span> <span className="font-bold">{currentRequest.quantity}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Request Date:</span> {currentRequest.requestDate}</p>
                {currentRequest.message && <p className="text-sm"><span className="text-muted-foreground">Message:</span> "{currentRequest.message}"</p>}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleRejectRequest}><X className="h-4 w-4 mr-1" />Reject</Button>
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
