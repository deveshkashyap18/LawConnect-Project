import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { listDemoCredentials } from "@/lib/authService";
import { getDashboardPath } from "@/lib/auth";
import { Scale } from "lucide-react";
import { toast } from "sonner";
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin } = useAuth();
  const [activeRole, setActiveRole] = useState("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoCredentials, setDemoCredentials] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDemoCredentials = async () => {
      const credentials = await listDemoCredentials();
      if (isMounted) {
        setDemoCredentials(credentials.filter((item) => item.role !== "admin"));
      }
    };

    loadDemoCredentials();

    return () => {
      isMounted = false;
    };
  }, []);

  const applyDemoCredentials = (role) => {
    const demo = demoCredentials.find((item) => item.role === role);
    if (!demo) return;
    setActiveRole(role);
    setEmail(demo.email);
    setPassword(demo.password);
  };

  const handleLogin = async (role) => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (email.trim().toLowerCase() === "admin@lawconnect.com") {
      toast.info("Admin account ke liye secure admin login page use ho raha hai.");
      navigate("/admin/login", {
        state: {
          from: location.state?.from,
          prefill: {
            email: email.trim(),
            password,
          },
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signin({ email, password, role });
      toast.success("Login successful!");
      const redirectPath = location.state?.from?.pathname;
      navigate(redirectPath || getDashboardPath(role), { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="main-content"
      className="min-h-screen gradient-hero flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 font-bold text-2xl mb-8"
        >
          <Scale className="h-8 w-8 text-primary" />
          <span>LAWCONNECT</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeRole}
              onValueChange={setActiveRole}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="lawyer">Lawyer</TabsTrigger>
              </TabsList>
              <TabsContent value="client">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin("client");
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="client@example.com"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Password</Label>
                    <Input
                      id="client-password"
                      type="password"
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Login as Client"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => applyDemoCredentials("client")}
                  >
                    Use Demo Client
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="lawyer">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin("lawyer");
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-email">Email</Label>
                    <Input
                      id="lawyer-email"
                      type="email"
                      placeholder="lawyer@example.com"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-password">Password</Label>
                    <Input
                      id="lawyer-password"
                      type="password"
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Login as Lawyer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => applyDemoCredentials("lawyer")}
                  >
                    Use Demo Lawyer
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              Admin access?{" "}
              <Link to="/admin/login" className="text-primary hover:underline">
                Open Admin Login
              </Link>
            </div>
            <div className="mt-4 rounded-md border p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-2">Demo Accounts</p>
              {demoCredentials.map((item) => (
                <p key={item.role}>
                  {item.role}: {item.email} / {item.password}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Login;
