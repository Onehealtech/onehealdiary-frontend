import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Store, Stethoscope, UserCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import axios from "axios";

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

  const [email, setEmail] = useState("demo@oneheal.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await axios.post(
        `${BASE_URL}/api/v1/auth/login`,
        {
          email,
          password,
        }
      );
      console.log(response);
      const data = response.data;

      // ✅ If 2FA required
      if (response.status === 200) {

        navigate("/verify-otp", {
          state: { email }, // pass email if needed
        });

      }

      // ✅ If 2FA not required



    } catch (error: any) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-clinical-lg animate-fade-in">
        <CardHeader className="text-center pb-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 self-start"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-3">
            <config.icon className="h-8 w-8 text-primary-foreground" />
          </div>

          <h1 className="font-display font-bold text-xl text-foreground">
            {config.label} Login
          </h1>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            className="w-full gradient-teal text-primary-foreground hover:opacity-90"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : `Login as ${config.label}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
