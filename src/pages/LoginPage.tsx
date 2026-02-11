import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Store, Stethoscope, UserCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const roleConfig = {
  super_admin: { label: "Super Admin", icon: Shield, redirect: "/super-admin" },
  vendor: { label: "Vendor", icon: Store, redirect: "/vendor" },
  doctor: { label: "Doctor", icon: Stethoscope, redirect: "/doctor" },
  assistant: { label: "Assistant", icon: UserCheck, redirect: "/assistant" },
};

export default function LoginPage() {
  const [params] = useSearchParams();
  const role = (params.get("role") || "doctor") as keyof typeof roleConfig;
  const config = roleConfig[role] || roleConfig.doctor;
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    login(role);
    navigate(config.redirect);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-clinical-lg animate-fade-in">
        <CardHeader className="text-center pb-2">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 self-start">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-3">
            <config.icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground">{config.label} Login</h1>
          <p className="text-sm text-muted-foreground">This is a demo. Click Login to continue.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input placeholder="demo@oneheal.com" defaultValue="demo@oneheal.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" defaultValue="password" />
          </div>
          <Button className="w-full gradient-teal text-primary-foreground hover:opacity-90" onClick={handleLogin}>
            Login as {config.label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
