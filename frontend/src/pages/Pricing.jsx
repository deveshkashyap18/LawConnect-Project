import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, FileText, MessageSquare, Search, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const clientPlans = [
  {
    tier: "basic",
    name: "Basic",
    price: 0,
    description: "For first-time users who want to browse lawyers and request consultations.",
    features: [
      "Search and filter verified lawyers",
      "View lawyer profiles and fees",
      "Book 1 active consultation request at a time",
      "Basic case timeline access",
    ],
  },
  {
    tier: "plus",
    name: "Client Plus",
    price: 499,
    description: "For clients actively consulting lawyers and managing more than one legal matter.",
    recommended: true,
    features: [
      "Unlimited consultation requests",
      "Priority support for booking issues",
      "Secure lawyer messaging after booking",
      "Document uploads and shared records",
      "Booking and notification history tracking",
    ],
  },
  {
    tier: "business",
    name: "Business",
    price: 1499,
    description: "For founders, teams, and repeat clients managing ongoing legal work.",
    features: [
      "Everything in Client Plus",
      "Multiple concurrent legal matters",
      "Priority lawyer discovery placement",
      "Centralized document coordination",
      "Faster support response window",
    ],
  },
];

const lawyerPlans = [
  {
    tier: "listing",
    name: "Listing",
    price: 0,
    description: "For lawyers who want a verified profile and manual consultation scheduling.",
    features: [
      "Create a public lawyer profile",
      "Display experience, city, and specialization",
      "Accept consultation requests",
      "Basic booking and review visibility",
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    price: 999,
    description: "For active practitioners who want to manage leads and slots more efficiently.",
    recommended: true,
    features: [
      "Priority listing in search results",
      "Slot management and consultation workflow",
      "Client messaging after confirmed booking",
      "Booking insights and response tracking",
      "Higher profile visibility for verified accounts",
    ],
  },
  {
    tier: "chambers",
    name: "Chambers",
    price: 2499,
    description: "For high-volume lawyers and boutique firms handling regular intake through LAWCONNECT.",
    features: [
      "Everything in Professional",
      "Enhanced profile branding",
      "Lead prioritization support",
      "Dedicated onboarding assistance",
      "Advanced visibility for premium practice areas",
    ],
  },
];

const featureHighlights = [
  {
    icon: Search,
    title: "Lawyer discovery",
    text: "Search by specialization, city, reviews, and fee range.",
  },
  {
    icon: MessageSquare,
    title: "Secure messaging",
    text: "Chat is unlocked after consultation booking to keep conversations relevant.",
  },
  {
    icon: FileText,
    title: "Booking & case records",
    text: "Track consultations, case updates, and shared documents from one account.",
  },
  {
    icon: Shield,
    title: "Verified ecosystem",
    text: "Lawyer profiles, reviews, and consultation flows stay aligned with the platform.",
  },
];

const formatPrice = (price) => (price === 0 ? "Free" : `Rs ${price.toLocaleString("en-IN")}/month`);

const Pricing = () => {
  const { currentUser } = useAuth();

  const handleSubscribe = (planName) => {
    toast.success(`${planName} plan selected.`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <section className="gradient-hero py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4">Simple Legal Platform Pricing</Badge>
            <h1 className="mb-4 text-5xl font-bold">Pricing that fits how LAWCONNECT is actually used</h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground">
              Choose a client or lawyer plan based on booking volume, communication needs, and profile visibility.
            </p>
            <Link to="/lawyers">
              <Button size="lg" className="gap-2">
                Browse Lawyers <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featureHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="p-6">
                    <Icon className="mb-4 h-10 w-10 text-primary" />
                    <h3 className="mb-2 font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="client" className="w-full">
            <TabsList className="mx-auto mb-12 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="client">For Clients</TabsTrigger>
              <TabsTrigger value="lawyer">For Lawyers</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                {clientPlans.map((plan) => (
                  <Card key={plan.tier} className={`relative ${plan.recommended ? "border-primary shadow-lg" : ""}`}>
                    {plan.recommended ? (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-premium text-white">
                          <Crown className="mr-1 h-3 w-3" />
                          Recommended
                        </Badge>
                      </div>
                    ) : null}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-4 text-4xl font-bold text-foreground">{formatPrice(plan.price)}</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="mb-6 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.recommended ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.name)}
                      >
                        {plan.price === 0 ? "Start Free" : "Choose Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lawyer">
              <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lawyerPlans.map((plan) => (
                  <Card key={plan.tier} className={`relative ${plan.recommended ? "border-primary shadow-lg" : ""}`}>
                    {plan.recommended ? (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-premium text-white">
                          <Crown className="mr-1 h-3 w-3" />
                          Recommended
                        </Badge>
                      </div>
                    ) : null}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-4 text-4xl font-bold text-foreground">{formatPrice(plan.price)}</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="mb-6 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.recommended ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.name)}
                      >
                        {plan.price === 0 ? "Stay on Free Listing" : "Upgrade Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Your current consultation fee</CardTitle>
                    <CardDescription>
                      This fee is shown to clients when they open your profile and booking slots.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-5xl font-bold text-foreground">
                        Rs {Number(currentUser?.hourlyRate || 0).toLocaleString("en-IN")}
                        <span className="text-lg font-normal text-muted-foreground">/hr</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {currentUser?.specialization?.join(", ") ||
                          "Update specialization and fee from your lawyer dashboard/profile."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/lawyer/dashboard">
                        <Button>Manage Slots</Button>
                      </Link>
                      <Link to="/settings">
                        <Button variant="outline">Open Settings</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Who should upgrade?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Choose Professional if you regularly receive consultation requests and need better profile visibility.</p>
                    <p>Choose Chambers if your practice handles frequent platform leads and premium listing matters.</p>
                    <p>Free Listing is enough if you only want a basic presence and occasional bookings.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
