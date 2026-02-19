import { useNavigate } from "react-router-dom";
import { Shield, Store, Stethoscope, UserCheck, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const roles = [
  { id: "super_admin", label: "Super Admin", icon: Shield, desc: "Full system management", path: "/login?role=super_admin" },
  { id: "vendor", label: "Vendor", icon: Store, desc: "Diary sales & activation", path: "/login?role=vendor" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, desc: "Patient care management", path: "/login?role=doctor" },
  { id: "assistant", label: "Assistant", icon: UserCheck, desc: "Delegated patient access", path: "/login?role=assistant" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <header className="p-6 flex items-center gap-2">
        <img src="/logo.png" alt="Elvantia" className="h-10 w-10 rounded-xl object-contain" />
        <span className="font-display font-bold text-xl text-primary-foreground">Elvantia</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/20 rounded-full px-4 py-1.5 mb-6">
            <Heart className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Breast Cancer Patient Diary Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-primary-foreground leading-tight max-w-3xl">
            Empowering Care,<br />One Entry at a Time
          </h1>
          <p className="text-primary-foreground/70 text-lg mt-4 max-w-xl mx-auto">
            A comprehensive platform for tracking, monitoring, and managing breast cancer patient diaries across the care continuum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full animate-fade-in">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="bg-card/10 backdrop-blur-sm border-primary-foreground/10 hover:bg-card/20 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              onClick={() => navigate(role.path)}
            >
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-2xl gradient-teal flex items-center justify-center mx-auto mb-4">
                  <role.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-primary-foreground text-lg">{role.label}</h3>
                <p className="text-primary-foreground/60 text-sm mt-1">{role.desc}</p>
                <div className="mt-4 flex items-center justify-center gap-1 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Continue <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-primary-foreground/40 text-xs">
        © 2025 Elvantia. All rights reserved.
      </footer>
    </div>
  );
}
