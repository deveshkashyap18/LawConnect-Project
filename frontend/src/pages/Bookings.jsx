import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { socket } from "@/lib/socketClient";
import { fetchBookings, cancelBooking, updateBookingStatus, createCaseRequest, payForBooking } from "@/lib/dataService";
import { CaseBookingDialog } from "@/components/CaseBookingDialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, DollarSign, Briefcase, CreditCard } from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";

export default function Bookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState("");

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
  });

  const getStatusVariant = (status) => {
    if (status === "approved" || status === "completed") {
      return "default";
    }

    if (status === "cancelled") {
      return "destructive";
    }

    return "secondary";
  };

  const loadBookings = async () => {
    try {
      const data = await fetchBookings();
      setBookings(data || []);
    } catch (e) {
      toast.error(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadBookings();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;

    socket.connect();
    socket.emit("join", currentUser.id);

    const handleBookingUpdated = (booking) => {
      setBookings((prev) => {
        const exists = prev.some((item) => item.id === booking.id);
        if (exists) {
          return prev.map((item) => (item.id === booking.id ? booking : item));
        }
        return [booking, ...prev];
      });
    };

    socket.on("booking_updated", handleBookingUpdated);

    return () => {
      socket.off("booking_updated", handleBookingUpdated);
    };
  }, [currentUser?.id]);

  const handleCancelBooking = async (id) => {
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled.");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      );
    } catch (e) {
      toast.error(e.message || "Failed to cancel booking");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const updatedBooking = await updateBookingStatus(id, status);
      toast.success(`Booking ${status}.`);
      setBookings((prev) =>
        prev.map((booking) => (booking.id === id ? updatedBooking : booking)),
      );
    } catch (e) {
      toast.error(e.message || "Failed to update booking");
    }
  };

  const handlePayNow = async (bookingId, method) => {
    try {
      setPayingBookingId(bookingId);
      const updatedBooking = await payForBooking(bookingId, method);
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
      );
      toast.success("Payment completed successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to complete payment.");
    } finally {
      setPayingBookingId("");
    }
  };

  const handleBookForCase = (booking) => {
    if (currentUser?.role !== "client") {
      toast.error("Only clients can book a lawyer for a case.");
      return;
    }
    setSelectedBooking(booking);
    setCaseDialogOpen(true);
  };

  const handleCreateCase = async (caseData) => {
    if (!selectedBooking) return;

    try {
      setIsCreatingCase(true);
      await createCaseRequest({
        lawyerId: selectedBooking.lawyerId,
        title: caseData.caseTitle,
        description: caseData.caseDescription,
      });
      toast.success("Case booked successfully! You can now manage case details from your dashboard.");
      setCaseDialogOpen(false);
      setSelectedBooking(null);

      // Refresh bookings
      const updated = await fetchBookings();
      setBookings(updated || []);

      setTimeout(() => {
        window.location.href = "/client/dashboard";
      }, 1200);
    } catch (error) {
      toast.error(error.message || "Failed to create case.");
    } finally {
      setIsCreatingCase(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Consultation History</h1>
        <p className="text-muted-foreground mb-6">
          Review your pending requests, approved meetings, completed consultations, and cancellations.
        </p>
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <Card>
             <CardContent className="p-6 text-center text-muted-foreground">
                No bookings found. You can book a consultation from a lawyer's profile.
             </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBookings.map((booking) => (
              <Card key={booking.id} className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Consultation with {currentUser.role === "lawyer" ? booking.clientName : booking.lawyerName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status}
                  </Badge>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" /> <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" /> <span>{booking.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" /> <span>INR {booking.amount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payment:</span>{" "}
                    <span className="font-medium capitalize">{booking.paymentStatus || "unpaid"}</span>
                  </div>

                  {booking.notes && (
                    <div className="bg-muted p-2 rounded text-sm mt-2">
                       <span className="font-semibold">Notes:</span> {booking.notes}
                    </div>
                  )}

                  {currentUser.role === "client" && ["pending", "approved"].includes(booking.status) && (
                    <div className="space-y-2">
                      {booking.paymentStatus !== "paid" ? (
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={payingBookingId === booking.id}
                            onClick={() => handlePayNow(booking.id, "upi")}
                          >
                            {payingBookingId === booking.id ? "..." : "UPI"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={payingBookingId === booking.id}
                            onClick={() => handlePayNow(booking.id, "card")}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={payingBookingId === booking.id}
                            onClick={() => handlePayNow(booking.id, "netbanking")}
                          >
                            Bank
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-success">Payment completed for this consultation.</div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  )}

                  {currentUser.role === "client" && booking.status === "completed" && !booking.caseId && (
                    <Button
                      size="sm"
                      className="w-full mt-4 gap-2"
                      onClick={() => handleBookForCase(booking)}
                      variant="outline"
                    >
                      <Briefcase className="h-4 w-4" />
                      Book for a Case
                    </Button>
                  )}

                  {currentUser.role === "client" && booking.caseId && (
                    <div className="text-sm text-success pt-2 border-t">
                      Linked to a case
                    </div>
                  )}

                  {currentUser.role === "client" && booking.status === "completed" && (
                    <div className="mt-4 pt-4 border-t">
                      <ReviewModal
                        lawyerId={booking.lawyerId}
                        lawyerName={booking.lawyerName}
                        onReviewSubmitted={() => loadBookings()}
                      />
                    </div>
                  )}

                  {currentUser.role === "lawyer" && booking.status === "pending" && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button size="sm" onClick={() => handleStatusUpdate(booking.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {currentUser.role === "lawyer" && booking.status === "approved" && (
                    <Button
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => handleStatusUpdate(booking.id, "completed")}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Case Booking Dialog */}
        {selectedBooking && (
          <CaseBookingDialog
            open={caseDialogOpen}
            onOpenChange={(open) => {
              setCaseDialogOpen(open);
              if (!open) setSelectedBooking(null);
            }}
            lawyerName={selectedBooking.lawyerName}
            bookingId={selectedBooking.id}
            onConfirm={handleCreateCase}
            isSubmitting={isCreatingCase}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
