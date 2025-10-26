import { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Shield, LogIn } from "lucide-react";
import { CompanyLogo } from "../ui/company-logo";

interface MainLoginPortalProps {
  onSelectAdminLogin: () => void;
  onSelectUserLogin: () => void;
  onSelectFabricatorSignup: () => void;
}

export function MainLoginPortal({
  onSelectAdminLogin,
  onSelectUserLogin,
  onSelectFabricatorSignup,
}: MainLoginPortalProps) {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!accessCode.trim()) {
      setError("Please enter an access code");
      return;
    }

    setError("");
    const code = accessCode.toLowerCase().trim();

    // Admin access codes
    if (
      code === "admin123" ||
      code === "administrator" ||
      code === "buildflow-admin"
    ) {
      onSelectAdminLogin();
      return;
    }

    // User access codes for supervisors and fabricators
    if (
      code.startsWith("sup") ||
      code.startsWith("fab") ||
      code === "user" ||
      code === "team-member"
    ) {
      onSelectUserLogin();
      return;
    }

    // Client access codes
    if (
      code.startsWith("client") ||
      code === "client123" ||
      code === "project-client"
    ) {
      onSelectUserLogin();
      return;
    }

    // Special signup codes for new fabricators
    if (
      code === "new-fabricator" ||
      code === "signup" ||
      code === "register-fab"
    ) {
      onSelectFabricatorSignup();
      return;
    }

    setError(
      "Invalid access code. Please contact your administrator.",
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl floating-delayed"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl floating"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-2xl floating-delayed"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 hover-lift hover-glow animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex items-center justify-center mb-4">
            <CompanyLogo size="xl" showText={true} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Secure Access Portal</CardTitle>
            </div>
            <CardDescription className="text-base">
              Enter your access code to continue to the system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accessCode" className="text-base">Access Code</Label>
            <Input
              id="accessCode"
              type="password"
              placeholder="Enter your secure access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center h-12 text-base"
            />
            {error && (
              <p className="text-sm text-destructive text-center mt-2">
                {error}
              </p>
            )}
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-12 text-base bg-accent hover:bg-accent/90"
            size="lg"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Access System
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}