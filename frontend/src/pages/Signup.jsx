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
import { sendVerificationOtp } from "@/lib/authService";
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

  // OTP related states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (email, role) => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (role === "client") {
      if (!clientData.name || !clientData.password) {
        toast.error("Please fill in Name and Password before requesting OTP.");
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
    } else {
      if (!lawyerData.name || !lawyerData.barId || !lawyerData.password) {
        toast.error("Please fill in Name, Bar ID, and Password before requesting OTP.");
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
    }

    setIsSubmitting(true);
    try {
      await sendVerificationOtp(email);
      setOtpSent(true);
      toast.success("Verification OTP has been sent successfully!");
      startCountdown();
    } catch (error) {
      toast.error(error.message || "Unable to send verification OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSignup = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the 6-digit verification OTP");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        role: "client",
        name: clientData.name,
        email: clientData.email,
        password: clientData.password,
        otp,
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
    if (!otp) {
      toast.error("Please enter the 6-digit verification OTP");
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
        otp,
      });
      toast.success("Account created! Pending verification.");
      navigate("/lawyer/dashboard");
    } catch (error) {
      toast.error(error.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOtpState = (val) => {
    setActiveRole(val);
    setOtpSent(false);
    setOtp("");
    setCountdown(0);
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
              onValueChange={resetOtpState}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client" disabled={otpSent}>Client</TabsTrigger>
                <TabsTrigger value="lawyer" disabled={otpSent}>Lawyer</TabsTrigger>
              </TabsList>
              <TabsContent value="client">
                <form onSubmit={handleClientSignup} className="space-y-4">
                  {!otpSent ? (
                    <>
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
                      <Button 
                        type="button" 
                        className="w-full" 
                        onClick={() => handleSendOtp(clientData.email, "client")}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending OTP..." : "Send Verification OTP"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-md bg-muted/60 p-4 border text-sm text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Verifying Email Address</p>
                        <p>{clientData.email}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client-otp">Enter 6-Digit OTP</Label>
                        <Input
                          id="client-otp"
                          placeholder="123456"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>



                      <Button type="submit" className="w-full" disabled={isSubmitting || otp.length !== 6}>
                        {isSubmitting ? "Creating account..." : "Verify & Create Client Account"}
                      </Button>

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full text-xs" 
                          onClick={() => setOtpSent(false)}
                        >
                          Back to Details
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full text-xs" 
                          disabled={countdown > 0 || isSubmitting}
                          onClick={() => handleSendOtp(clientData.email, "client")}
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </TabsContent>
              <TabsContent value="lawyer">
                <form onSubmit={handleLawyerSignup} className="space-y-4">
                  {!otpSent ? (
                    <>
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
                      <Button 
                        type="button" 
                        className="w-full" 
                        onClick={() => handleSendOtp(lawyerData.email, "lawyer")}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending OTP..." : "Send Verification OTP"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-md bg-muted/60 p-4 border text-sm text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Verifying Email Address</p>
                        <p>{lawyerData.email}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lawyer-otp">Enter 6-Digit OTP</Label>
                        <Input
                          id="lawyer-otp"
                          placeholder="123456"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>



                      <Button type="submit" className="w-full" disabled={isSubmitting || otp.length !== 6}>
                        {isSubmitting ? "Creating account..." : "Verify & Create Lawyer Account"}
                      </Button>

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full text-xs" 
                          onClick={() => setOtpSent(false)}
                        >
                          Back to Details
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full text-xs" 
                          disabled={countdown > 0 || isSubmitting}
                          onClick={() => handleSendOtp(lawyerData.email, "lawyer")}
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </Button>
                      </div>
                    </>
                  )}
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
