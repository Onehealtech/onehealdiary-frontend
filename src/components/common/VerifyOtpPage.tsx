import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const email = location.state?.email;

    const handleVerify = async () => {
        try {
            setLoading(true);

            const BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const tempToken = localStorage.getItem("tempToken");

            const response = await axios.post(
                `${BASE_URL}/api/v1/auth/verify-2fa`,
                {
                    email: email,
                    otp: otp,
                },

            );

            const { token, user } = response.data.data;
            console.log(response.data, token, user);
            // Save real token
            localStorage.setItem("token", token);

            login(user);
            if (user.role === "DOCTOR") {
                navigate("/doctor");
            } if (user.role === "ASSISTANT") {
                navigate("/assistant");
            } if (user.role === "VENDOR") {
                navigate("/vendor");
            } if (user.role === "SUPER_ADMIN") {
                navigate("/super-admin");
            }

        } catch (error: any) {
            alert(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <h2 className="text-xl font-bold">Verify OTP</h2>
                    <p className="text-sm text-muted-foreground">
                        Enter OTP sent to {email}
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label>OTP</Label>
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                            placeholder="Enter 6 digit OTP"
                            maxLength={6}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleVerify}
                        disabled={loading}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
