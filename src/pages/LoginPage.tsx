import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Store, Stethoscope, UserCheck, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);

      await axios.post(`${BASE_URL}/api/v1/auth/login`, { email, password });

      navigate("/verify-otp", {
        state: { email },
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/auth/forgot-password`, {
        email: forgotEmail.trim(),
      });
      const data = res.data;
      const token = data.data?.resetToken || data.resetToken;
      if (token) {
        setForgotToken(token);
        setForgotMessage("A password reset link has been sent to your email.");
        setTimeout(() => {
          setForgotStep(2);
          setForgotMessage("");
        }, 1500);
      } else {
        setForgotMessage("Could not send reset link. Please check your email and try again.");
      }
    } catch (error: any) {
      setForgotMessage(error.response?.data?.message || "Failed to send reset link.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotNewPassword || !forgotConfirmPassword) return;
    if (!forgotToken.trim()) {
      setForgotMessage("Reset token was not received. Please click \"Resend token\" and try again.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage("Passwords do not match.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotMessage("Password must be at least 6 characters.");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/reset-password`, {
        resetToken: forgotToken.trim(),
        newPassword: forgotNewPassword,
      });
      setForgotMessage("Password reset successfully! You can now log in with your new password.");
      // Reset and go back to login after short delay
      setTimeout(() => {
        setForgotMode(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotToken("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotMessage("");
      }, 2000);
    } catch (error: any) {
      setForgotMessage(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setForgotMode(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotToken("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotMessage("");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-clinical-lg animate-fade-in">
        <CardHeader className="text-center pb-2">
          <button
            onClick={forgotMode ? handleBackToLogin : () => navigate("/")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 self-start"
          >
            <ArrowLeft className="h-4 w-4" /> {forgotMode ? "Back to Login" : "Back"}
          </button>

          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-3">
            {forgotMode
              ? <KeyRound className="h-8 w-8 text-primary-foreground" />
              : <config.icon className="h-8 w-8 text-primary-foreground" />
            }
          </div>

          <h1 className="font-display font-bold text-xl text-foreground">
            {forgotMode
              ? (forgotStep === 1 ? "Forgot Password" : "Reset Password")
              : `${config.label} Login`}
          </h1>
          {forgotMode && forgotStep === 2 && (
            <p className="text-sm text-muted-foreground mt-1">Enter your new password below.</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {!forgotMode ? (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="demo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full gradient-teal text-primary-foreground hover:opacity-90"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Logging in..." : `Login as ${config.label}`}
              </Button>

              <button
                type="button"
                onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot Password?
              </button>
            </>
          ) : forgotStep === 1 ? (
            <>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendResetCode()}
                />
              </div>

              {forgotMessage && (
                <p className={`text-sm ${forgotMessage.toLowerCase().includes("sent") ? "text-green-600" : "text-destructive"}`}>
                  {forgotMessage}
                </p>
              )}

              <Button
                className="w-full gradient-teal text-primary-foreground hover:opacity-90"
                onClick={handleSendResetCode}
                disabled={forgotLoading || !forgotEmail.trim()}
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                A reset link was sent to your email. Enter your new password below.
              </p>

              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showForgotPwd ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowForgotPwd(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showForgotPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
              </div>

              {forgotMessage && (
                <p className={`text-sm ${forgotMessage.toLowerCase().includes("successfully") ? "text-green-600" : "text-destructive"}`}>
                  {forgotMessage}
                </p>
              )}

              <Button
                className="w-full gradient-teal text-primary-foreground hover:opacity-90"
                onClick={handleResetPassword}
                disabled={forgotLoading || !forgotNewPassword || !forgotConfirmPassword}
              >
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <button
                type="button"
                onClick={() => { setForgotStep(1); setForgotMessage(""); }}
                className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Didn't receive the link? Go back
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
