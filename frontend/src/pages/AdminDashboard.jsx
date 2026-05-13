import { useEffect, useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  IndianRupee,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchAdminOverview,
  deleteLawyerByAdmin,
  deleteLawyerSlotByAdmin,
  updateLawyerVerification,
  updateTransactionStatus,
  updateBookingStatus,
} from "@/lib/dataService";

const formatCurrency = (value) => `INR ${value.toLocaleString("en-IN")}`;

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const data = await fetchAdminOverview();
        if (isMounted) {
          setOverview(data);
        }
      } catch (error) {
        toast.error(error.message || "Unable to load admin overview.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = overview?.stats || {
    totalUsers: 0,
    totalLawyers: 0,
    pendingLawyers: 0,
    totalTransactions: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeCases: 0,
    openDisputes: 0,
    totalMessages: 0,
    totalReviews: 0,
  };

  const lawyers = useMemo(() => overview?.lawyers || [], [overview?.lawyers]);
  const users = useMemo(() => overview?.users || [], [overview?.users]);
  const bookings = useMemo(() => overview?.bookings || [], [overview?.bookings]);
  const transactions = useMemo(
    () => overview?.transactions || [],
    [overview?.transactions],
  );

  const pendingLawyers = useMemo(
    () => lawyers.filter((lawyer) => !lawyer.verified),
    [lawyers],
  );

  const disputedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === "disputed"),
    [transactions],
  );

  const handleVerifyLawyer = async (lawyerId, verified) => {
    try {
      const updatedLawyer = await updateLawyerVerification(lawyerId, verified);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              lawyers: prev.lawyers.map((lawyer) =>
                lawyer.id === lawyerId ? updatedLawyer : lawyer,
              ),
              stats: {
                ...prev.stats,
                totalLawyers: verified
                  ? prev.lawyers.filter((lawyer) => lawyer.verified).length + 1
                  : Math.max(prev.stats.totalLawyers - 1, 0),
                pendingLawyers: verified
                  ? Math.max(prev.stats.pendingLawyers - 1, 0)
                  : prev.stats.pendingLawyers + 1,
              },
            }
          : prev,
      );
      toast.success(
        verified ? "Lawyer verified successfully." : "Lawyer moved back to pending review.",
      );
    } catch (error) {
      toast.error(error.message || "Unable to update lawyer verification.");
    }
  };

  const handleTransactionStatus = async (transactionId, status) => {
    try {
      const updatedTransaction = await updateTransactionStatus(transactionId, status);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              transactions: prev.transactions.map((transaction) =>
                transaction.id === transactionId ? updatedTransaction : transaction,
              ),
            }
          : prev,
      );
      toast.success("Transaction updated successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to update transaction.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, "cancelled");
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              bookings: prev.bookings.map((booking) =>
                booking.id === bookingId ? updatedBooking : booking,
              ),
            }
          : prev,
      );
      toast.success("Booking forcefully cancelled.");
    } catch (error) {
      toast.error(error.message || "Unable to cancel booking.");
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    try {
      const lawyerToDelete = overview?.lawyers?.find((lawyer) => lawyer.id === lawyerId);
      await deleteLawyerByAdmin(lawyerId);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              lawyers: prev.lawyers.filter((lawyer) => lawyer.id !== lawyerId),
              users: prev.users.filter((user) => user.id !== lawyerToDelete?.userId),
              bookings: prev.bookings.filter((booking) => booking.lawyerId !== lawyerId),
            }
          : prev,
      );
      toast.success("Lawyer removed successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to remove lawyer.");
    }
  };

  const handleDeleteSlot = async (lawyerId, slotId) => {
    try {
      const response = await deleteLawyerSlotByAdmin(lawyerId, slotId);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              lawyers: prev.lawyers.map((lawyer) =>
                lawyer.id === lawyerId ? response.lawyer : lawyer,
              ),
            }
          : prev,
      );
      toast.success("Slot removed.");
    } catch (error) {
      toast.error(error.message || "Unable to remove slot.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="flex-1">
        <div className="gradient-primary py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/80">
              Manage users, lawyer verification, disputes, and platform revenue.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified Lawyers</p>
                    <p className="text-3xl font-bold">{stats.totalLawyers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList>
              <TabsTrigger value="users">Clients</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="verification">Lawyer Verification</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Registered Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{booking.clientName} with {booking.lawyerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.date} | {booking.timeSlot}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Payment: <span className="font-medium capitalize text-foreground">{booking.paymentStatus}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={booking.status === "approved" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
                              {booking.status}
                            </Badge>
                            {["pending", "approved"].includes(booking.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Force Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Pending Lawyer Verifications
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({stats.pendingLawyers})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading verification queue...</p>
                  ) : pendingLawyers.length === 0 ? (
                    <p className="text-muted-foreground">No pending lawyers at the moment.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingLawyers.map((lawyer) => (
                        <div key={lawyer.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={lawyer.avatar}
                                alt={lawyer.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <p className="font-semibold">{lawyer.name}</p>
                                <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Bar ID</p>
                              <p className="text-sm font-medium">{lawyer.barId || "Not submitted"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Experience</p>
                              <p className="text-sm font-medium">{lawyer.experience} years</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Specialization</p>
                              <p className="text-sm font-medium">
                                {lawyer.specialization.join(", ") || "General Practice"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => handleVerifyLawyer(lawyer.id, true)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyLawyer(lawyer.id, false)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Keep Pending
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLawyer(lawyer.id)}
                            >
                              Remove Lawyer
                            </Button>
                          </div>
                          {lawyer.consultationSlots?.length ? (
                            <div className="mt-4 space-y-2">
                              {lawyer.consultationSlots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between border rounded p-2">
                                  <span className="text-sm">
                                    {slot.date} | {slot.startTime} - {slot.endTime}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteSlot(lawyer.id, slot.id)}
                                    disabled={slot.isBooked}
                                  >
                                    Remove Slot
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disputes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Active Disputes
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({stats.openDisputes})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disputedTransactions.length === 0 ? (
                    <p className="text-muted-foreground">No active disputes right now.</p>
                  ) : (
                    <div className="space-y-4">
                      {disputedTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 border rounded-lg border-destructive/50"
                        >
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <div>
                              <p className="font-semibold">{transaction.caseTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.clientName} vs {transaction.lawyerName}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Disputed
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-muted-foreground">
                              Amount: {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Paid on: {transaction.paidAt}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleTransactionStatus(transaction.id, "completed")}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransactionStatus(transaction.id, "refunded")}
                            >
                              Refund
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-4 p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{transaction.caseTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.clientName} to {transaction.lawyerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Method: {transaction.method} {transaction.bookingId ? `| Booking ${transaction.bookingId.slice(-6)}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                          <Badge variant="secondary" className="mt-1 capitalize">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active Cases</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-success" />
                          <span className="font-semibold">{stats.activeCases}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Reviews Collected</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-success" />
                          <span className="font-semibold">{stats.totalReviews}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Messages Exchanged</span>
                        <span className="font-semibold">{stats.totalMessages}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed Revenue</span>
                        <span className="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pending Lawyer Reviews</span>
                        <span className="font-semibold">{stats.pendingLawyers}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold">Open Disputes</span>
                        <span className="font-bold text-lg">{stats.openDisputes}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
