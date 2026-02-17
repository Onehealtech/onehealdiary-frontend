import { useState, useEffect } from "react";
import { Building, Check, ChevronLeft, ChevronRight, IndianRupee, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ================= TYPES =================

interface DoctorFormData {
    name: string;
    email: string;
    phone: string;
    hospital: string;
    specialization: string;
    license: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    commissionType: "FIXED" | "PERCENTAGE" | "";
    commissionRate: string;
}

interface VendorFormData {
    name: string;
    email: string;
    phone: string;
    location: string;
    GST: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    commissionType: "FIXED" | "PERCENTAGE" | "";
    commissionRate: string;
}

interface Props {
    type: "DOCTOR" | "VENDOR";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: DoctorFormData | VendorFormData) => Promise<void>;
    isSubmitting?: boolean;
}

const initialDoctor: DoctorFormData = {
    name: "", email: "", phone: "", hospital: "", specialization: "", license: "",
    accountHolder: "", accountNumber: "", ifsc: "",
    commissionType: "", commissionRate: "",
};

const initialVendor: VendorFormData = {
    name: "", email: "", phone: "", location: "", GST: "",
    accountHolder: "", accountNumber: "", ifsc: "",
    commissionType: "", commissionRate: "",
};

export default function StaffStepperDialog({
    type, open, onOpenChange, onSubmit, isSubmitting = false,
}: Props) {

    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState<any>(type === "DOCTOR" ? initialDoctor : initialVendor);
    const STEPS = [{ label: "Personal Info", icon: User }, { label: "Bank Details", icon: Building }, { label: "Financial Info", icon: IndianRupee },];
    useEffect(() => {
        setForm(type === "DOCTOR" ? initialDoctor : initialVendor);
        setStep(0);
        setErrors({});
    }, [type]);

    const handleChange = (field: string, value: string) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[field];
            return copy;
        });
    };

    // ================= VALIDATION =================

    const validateStep = (current: number) => {
        const newErrors: Record<string, string> = {};

        if (current === 0) {
            if (!form.name.trim()) newErrors.name = "Name required";
            if (!form.email.trim()) newErrors.email = "Email required";
            else if (!/\S+@\S+\.\S+/.test(form.email))
                newErrors.email = "Invalid email";

            if (!form.phone.trim()) newErrors.phone = "Phone required";

            if (type === "DOCTOR") {
                if (!form.hospital.trim()) newErrors.hospital = "Hospital required";
                if (!form.specialization.trim())
                    newErrors.specialization = "Specialization required";
                if (!form.license.trim())
                    newErrors.license = "License required";
            } else {
                if (!form.location.trim()) newErrors.location = "Location required";
                if (!form.GST.trim()) newErrors.GST = "GST required";
                else if (form.GST.length !== 15)
                    newErrors.GST = "GST must be 15 characters";
            }
        }

        if (current === 1) {
            if (!form.accountHolder.trim())
                newErrors.accountHolder = "Account holder required";
            if (!form.accountNumber.trim())
                newErrors.accountNumber = "Account number required";
            if (!form.ifsc.trim())
                newErrors.ifsc = "IFSC required";
            else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase()))
                newErrors.ifsc = "Invalid IFSC";
        }

        if (current === 2) {
            if (!form.commissionType)
                newErrors.commissionType = "Select commission type";
            if (!form.commissionRate.trim())
                newErrors.commissionRate = "Commission rate required";
            else {
                const rate = parseFloat(form.commissionRate);
                if (isNaN(rate) || rate < 0)
                    newErrors.commissionRate = "Invalid amount";
                if (form.commissionType === "PERCENTAGE" && rate > 100)
                    newErrors.commissionRate = "Max 100% allowed";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (!validateStep(step)) return;
        await onSubmit(form);
    };

    const handleClose = (val: boolean) => {
        if (!val) {
            setStep(0);
            setErrors({});
            setForm(type === "DOCTOR" ? initialDoctor : initialVendor);
        }
        onOpenChange(val);
    };

    // ================= UI =================

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Add {type === "DOCTOR" ? "Doctor" : "Vendor"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-between mb-6 px-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = i < step;
                        const active = i === step;
                        return (
                            <div key={i} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                    ${done ? "bg-green-500 text-white" : active ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}
                  `}>
                                        {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </div>
                                    <span className={`text-xs mt-1.5 whitespace-nowrap ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 mt-[-14px] rounded ${done ? "bg-green-500" : "bg-muted"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* STEP 1 */}
                {step === 0 && (
                    <div className="space-y-3">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>

                        <div>
                            <Label>Phone *</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>

                        {type === "DOCTOR" ? (
                            <>
                                <div>
                                    <Label>Hospital *</Label>
                                    <Input
                                        value={form.hospital}
                                        onChange={(e) => handleChange("hospital", e.target.value)}
                                    />
                                    {errors.hospital && <p className="text-xs text-red-500">{errors.hospital}</p>}
                                </div>

                                <div>
                                    <Label>Specialization *</Label>
                                    <Input
                                        value={form.specialization}
                                        onChange={(e) => handleChange("specialization", e.target.value)}
                                    />
                                    {errors.specialization && <p className="text-xs text-red-500">{errors.specialization}</p>}
                                </div>
                                <div>
                                    <Label>License Number *</Label>
                                    <Input
                                        value={form.license}
                                        onChange={(e) => handleChange("license", e.target.value)}
                                    />
                                    {errors.license && <p className="text-xs text-red-500">{errors.license}</p>}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Label>Location *</Label>
                                    <Input
                                        value={form.location}
                                        onChange={(e) => handleChange("location", e.target.value)}
                                    />
                                    {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                                </div>

                                <div>
                                    <Label>GST *</Label>
                                    <Input
                                        maxLength={15}
                                        value={form.GST}
                                        onChange={(e) => handleChange("GST", e.target.value)}
                                    />
                                    {errors.GST && <p className="text-xs text-red-500">{errors.GST}</p>}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* STEP 2 */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div>
                            <Label>Account Holder *</Label>
                            <Input
                                value={form.accountHolder}
                                onChange={(e) => handleChange("accountHolder", e.target.value)}
                            />
                            {errors.accountHolder && <p className="text-xs text-red-500">{errors.accountHolder}</p>}
                        </div>

                        <div>
                            <Label>Account Number *</Label>
                            <Input
                                value={form.accountNumber}
                                onChange={(e) => handleChange("accountNumber", e.target.value)}
                            />
                            {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber}</p>}
                        </div>

                        <div>
                            <Label>IFSC *</Label>
                            <Input
                                value={form.ifsc}
                                onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
                            />
                            {errors.ifsc && <p className="text-xs text-red-500">{errors.ifsc}</p>}
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 2 && (
                    <div className="space-y-3">
                        <div>
                            <Label>Commission Type *</Label>
                            <Select
                                value={form.commissionType}
                                onValueChange={(v) => handleChange("commissionType", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED">Fixed (₹)</SelectItem>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.commissionType && <p className="text-xs text-red-500">{errors.commissionType}</p>}
                        </div>

                        <div>
                            <Label>Commission Rate *</Label>
                            <Input
                                type="number"
                                value={form.commissionRate}
                                onChange={(e) => handleChange("commissionRate", e.target.value)}
                            />
                            {errors.commissionRate && <p className="text-xs text-red-500">{errors.commissionRate}</p>}
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <DialogFooter className="flex justify-between mt-4">
                    <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>

                    {step < 2 ? (
                        <Button onClick={handleNext}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
