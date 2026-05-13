import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Scale } from "lucide-react";
import { toast } from "sonner";
const Signup = ({ initialTab = "client" }) => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [activeRole, setActiveRole] = useState(initialTab);
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [lawyerData, setLawyerData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    barId: "",
    specialization: "",
    experience: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleClientSignup = async (e) => {
    e.preventDefault();
    if (!clientData.name || !clientData.email || !clientData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isValidEmail(clientData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (clientData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (clientData.password !== clientData.confirmPassword) {
      toast.error("Password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        role: "client",
        name: clientData.name,
        email: clientData.email,
        password: clientData.password,
      });
      toast.success("Account created successfully!");
      navigate("/client/dashboard");
    } catch (error) {
      toast.error(error.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLawyerSignup = async (e) => {
    e.preventDefault();
    if (
      !lawyerData.name ||
      !lawyerData.email ||
      !lawyerData.password ||
      !lawyerData.barId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isValidEmail(lawyerData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (lawyerData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (lawyerData.password !== lawyerData.confirmPassword) {
      toast.error("Password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        role: "lawyer",
        name: lawyerData.name,
        email: lawyerData.email,
        password: lawyerData.password,
        barId: lawyerData.barId,
        specialization: lawyerData.specialization,
        experience: lawyerData.experience,
      });
      toast.success("Account created! Pending verification.");
      navigate("/lawyer/dashboard");
    } catch (error) {
      toast.error(error.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="main-content"
      className="min-h-screen gradient-hero flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 font-bold text-2xl mb-8"
        >
          <Scale className="h-8 w-8 text-primary" />
          <span>LAWCONNECT</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Choose your account type and get started
            </CardDescription>
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
                <form onSubmit={handleClientSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Full Name</Label>
                    <Input
                      id="client-name"
                      placeholder="John Doe"
                      value={clientData.name}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="john@example.com"
                      value={clientData.email}
                      autoComplete="email"
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Password</Label>
                    <Input
                      id="client-password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={clientData.password}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-confirm-password">Confirm Password</Label>
                    <Input
                      id="client-confirm-password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={clientData.confirmPassword}
                      onChange={(e) =>
                        setClientData({
                          ...clientData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create Client Account"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="lawyer">
                <form onSubmit={handleLawyerSignup} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lawyer-name">Full Name</Label>
                      <Input
                        id="lawyer-name"
                        placeholder="Jane Smith"
                        value={lawyerData.name}
                        onChange={(e) =>
                          setLawyerData({
                            ...lawyerData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lawyer-bar">Bar ID *</Label>
                      <Input
                        id="lawyer-bar"
                        placeholder="NY-2015-12345"
                        value={lawyerData.barId}
                        onChange={(e) =>
                          setLawyerData({
                            ...lawyerData,
                            barId: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-email">Email</Label>
                    <Input
                      id="lawyer-email"
                      type="email"
                      placeholder="jane@lawfirm.com"
                      value={lawyerData.email}
                      autoComplete="email"
                      onChange={(e) =>
                        setLawyerData({
                          ...lawyerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-password">Password</Label>
                    <Input
                      id="lawyer-password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={lawyerData.password}
                      onChange={(e) =>
                        setLawyerData({
                          ...lawyerData,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-confirm-password">
                      Confirm Password
                    </Label>
                    <Input
                      id="lawyer-confirm-password"
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={lawyerData.confirmPassword}
                      onChange={(e) =>
                        setLawyerData({
                          ...lawyerData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-specialization">
                      Specialization
                    </Label>
                    <Input
                      id="lawyer-specialization"
                      placeholder="Corporate Law, Tax Law"
                      value={lawyerData.specialization}
                      onChange={(e) =>
                        setLawyerData({
                          ...lawyerData,
                          specialization: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer-experience">
                      Years of Experience
                    </Label>
                    <Input
                      id="lawyer-experience"
                      type="number"
                      placeholder="10"
                      value={lawyerData.experience}
                      onChange={(e) =>
                        setLawyerData({
                          ...lawyerData,
                          experience: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create Lawyer Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your account will be verified before activation
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Signup;
