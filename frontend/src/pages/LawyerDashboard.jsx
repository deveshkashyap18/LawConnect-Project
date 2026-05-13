import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

import { CaseUpdateDialog } from "@/components/CaseUpdateDialog";
import {
  addCaseTimelineEvent,
  createLawyerSlot,
  deleteLawyerSlot,
  fetchBookings,
  fetchCases,
  fetchLawyerEarnings,
  fetchLawyerSlots,
  updateBookingStatus,
  updateLawyerSlot,
  uploadDocument,
} from "@/lib/dataService";
import { socket } from "@/lib/socketClient";
import {
  addMinutesToTime,
  generateDefaultSlots,
  formatSlot,
  formatDate,
  getWeekdayDatesFrom,
} from "@/lib/slotUtils";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  IndianRupee,
  MessageSquare,
  Paperclip,
  Plus,
  Star,
  TrendingUp,
  Users,
  XCircle,
  Zap,
  Download,
  FileText
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const LawyerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [lawyerCases, setLawyerCases] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [earningsData, setEarningsData] = useState({ totalEarnings: 0, thisMonthEarnings: 0, transactionsCount: 0 });
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [slotForm, setSlotForm] = useState({ date: "", startTime: "10:00", endTime: "10:45" });
  const [editingSlotId, setEditingSlotId] = useState("");
  const [uploadingCaseId, setUploadingCaseId] = useState(null);
  const fileInputRef = useRef(null);

  // verified comes from the lawyer profile via hydrateUser in authController
  const isVerifiedLawyer = currentUser?.verified === true;

  useEffect(() => {
    if (!isVerifiedLawyer) {
      setIsLoadingCases(false);
      return undefined;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [casesData, earnings, bookingsData, slotsData] = await Promise.all([
          fetchCases(),
          fetchLawyerEarnings().catch(() => ({ totalEarnings: 0, thisMonthEarnings: 0, transactionsCount: 0 })),
          fetchBookings().catch(() => []),
          fetchLawyerSlots().catch(() => []),
        ]);
        if (isMounted) {
          setLawyerCases(casesData);
          setEarningsData(earnings);
          setBookings(bookingsData);
          setSlots(slotsData);
        }
      } catch (error) {
        toast.error(error.message || "Unable to load data.");
      } finally {
        if (isMounted) setIsLoadingCases(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [isVerifiedLawyer]);

  useEffect(() => {
    if (!currentUser?.id || !isVerifiedLawyer) return;

    socket.connect();
    socket.emit("join", currentUser.id);

    const handleSocketUpdate = (updatedCase) => {
      setLawyerCases((prev) =>
        prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
      );
    };

    socket.on("case_update", handleSocketUpdate);
    socket.on("timeline_update", handleSocketUpdate);

    const handleBookingUpdate = (updatedBooking) => {
      setBookings((prev) => {
        const exists = prev.find((b) => b.id === updatedBooking.id);
        if (exists) {
          return prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
        }
        return [updatedBooking, ...prev];
      });
    };
    socket.on("booking_updated", handleBookingUpdate);

    return () => {
      socket.off("case_update", handleSocketUpdate);
      socket.off("timeline_update", handleSocketUpdate);
      socket.off("booking_updated", handleBookingUpdate);
    };
  }, [currentUser?.id, isVerifiedLawyer]);
  const handleDownload = (url, filename) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || "document");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending"),
    [bookings],
  );

  const stats = {
    totalEarnings: earningsData.totalEarnings || 0,
    thisMonthEarnings: earningsData.thisMonthEarnings || 0,
    activeCases: lawyerCases.filter((c) => c.status === "active").length,
    // Use real rating/reviews/reputation from lawyer profile (via hydrateUser)
    rating: currentUser?.rating ?? 0,
    totalReviews: currentUser?.totalReviews ?? 0,
    reputationScore: currentUser?.reputationScore ?? 0,
  };

  const resetSlotForm = () => {
    setSlotForm({ date: "", startTime: "10:00", endTime: "10:45" });
    setEditingSlotId("");
  };

  // Upload document for a specific case
  const handleDocumentUpload = async (caseId, file) => {
    if (!file) return;
    try {
      setUploadingCaseId(caseId);
      await uploadDocument(file);
      toast.success(`Document "${file.name}" uploaded to case.`);
    } catch (error) {
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setUploadingCaseId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isVerifiedLawyer) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <div className="flex-1">
          <div className="gradient-primary py-8">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold text-white">
                Welcome, {currentUser?.name || "Lawyer"}
              </h1>
              <p className="text-white/80">
                Your LawConnect lawyer account is pending admin verification.
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Verification In Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You can login and manage basic account details, but consultations, slots,
                  earnings, and client workflows will unlock only after admin approval.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={() => navigate("/profile")}>Open Profile</Button>
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    Open Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSlotSubmit = async () => {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      toast.error("Please fill date, start time, and end time.");
      return;
    }

    try {
      if (editingSlotId) {
        const response = await updateLawyerSlot(editingSlotId, slotForm);
        setSlots(response.slots || []);
        resetSlotForm();
        toast.success("Slot updated.");
        return;
      }

      const weekdayDates = getWeekdayDatesFrom(slotForm.date, 30);
      let createdCount = 0;

      for (const date of weekdayDates) {
        try {
          await createLawyerSlot({ date, startTime: slotForm.startTime, endTime: slotForm.endTime });
          createdCount += 1;
        } catch (error) {
          if (!String(error?.message || "").toLowerCase().includes("already exists")) throw error;
        }
      }

      const updatedSlots = await fetchLawyerSlots();
      setSlots(updatedSlots || []);
      resetSlotForm();
      toast.success(
        createdCount > 0
          ? `Created ${createdCount} weekday slots from the selected time.`
          : "Matching weekday slots already exist.",
      );
    } catch (error) {
      toast.error(error.message || "Unable to save slot.");
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlotId(slot.id);
    setSlotForm({ date: slot.date || "", startTime: slot.startTime, endTime: slot.endTime });
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const response = await deleteLawyerSlot(slotId);
      setSlots(response.slots || []);
      if (editingSlotId === slotId) resetSlotForm();
      toast.success("Slot deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete slot.");
    }
  };

  const handleGenerateDefaultSlots = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const defaultSlots = generateDefaultSlots(dateStr);
      let createdCount = 0;

      for (const slot of defaultSlots) {
        try {
          await createLawyerSlot({ date: dateStr, startTime: slot.startTime, endTime: slot.endTime });
          createdCount++;
        } catch (e) {
          // skip existing
        }
      }

      if (createdCount > 0) {
        const updated = await fetchLawyerSlots();
        setSlots(updated || []);
        toast.success(`Generated ${createdCount} standard slots for tomorrow (10 AM - 4 PM).`);
      } else {
        toast.info("No new slots were generated. Slots may already exist for that day.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to generate default slots.");
    }
  };

  const handleBookingStatusChange = async (bookingId, status) => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b)),
      );
      setSlots(await fetchLawyerSlots().catch(() => slots));
      toast.success(`Booking ${status}.`);
    } catch (error) {
      toast.error(error.message || "Unable to update booking.");
    }
  };

  const membershipLabel = currentUser?.membershipTier
    ? currentUser.membershipTier.charAt(0).toUpperCase() + currentUser.membershipTier.slice(1)
    : "Free";

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      {/* Hidden file input for document upload per case */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingCaseId) handleDocumentUpload(uploadingCaseId, file);
        }}
      />
      <div className="flex-1">
        <div className="gradient-primary py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {currentUser?.name || "Lawyer"}!
                </h1>
                <p className="text-white/80">Manage your practice, clients, and case activity.</p>
              </div>
              <Badge className="gradient-premium text-lg px-4 py-2">{membershipLabel} Member</Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                    <p className="text-2xl font-bold">{stats.activeCases}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">{stats.rating || "—"}</p>
                  </div>
                  <Star className="h-8 w-8 text-accent fill-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                    <p className="text-2xl font-bold">{stats.totalReviews}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reputation</p>
                    <p className="text-2xl font-bold">{stats.reputationScore}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reputation Progress Bar */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reputation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Score</span>
                  <span className="font-semibold">{stats.reputationScore}/100</span>
                </div>
                <Progress value={stats.reputationScore} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Based on client reviews, response time, and case success rate.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="cases" className="w-full">
            <TabsList>
              <TabsTrigger value="cases">My Cases</TabsTrigger>
              <TabsTrigger value="slots">Manage Slots</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                Consultation Requests
                {pendingBookings.length > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center text-[10px] animate-pulse">
                    {pendingBookings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Cases Tab */}
            <TabsContent value="cases" className="mt-6">
              <div className="grid gap-6">
                {isLoadingCases ? (
                  <Card><CardContent className="p-6 text-muted-foreground">Loading cases...</CardContent></Card>
                ) : lawyerCases.length === 0 ? (
                  <Card><CardContent className="p-6 text-muted-foreground">No cases yet. Once a client sends a consultation request, it will appear here.</CardContent></Card>
                ) : (
                  lawyerCases.map((caseItem) => (
                    <Card key={caseItem.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl">{caseItem.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Case ID: {caseItem.id}</p>
                          </div>
                          <Badge variant={caseItem.status === "active" ? "default" : "secondary"}>
                            {caseItem.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{caseItem.description}</p>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">
                              {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Documents</p>
                            <p className="text-sm font-medium">{caseItem.documents?.length ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium">
                              {caseItem.updatedAt ? new Date(caseItem.updatedAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Responsive Document List */}
                        {caseItem.documents && caseItem.documents.length > 0 && (
                          <div className="mb-6 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Case Documents</h4>
                            {caseItem.documents.map((doc) => (
                              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                    <FileText className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{doc.name}</p>
                                    <p className="text-[10px] text-muted-foreground italic">Uploaded on {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownload(doc.url, doc.name)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => navigate("/messages")}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message Client
                          </Button>
                          <CaseUpdateDialog
                            caseId={caseItem.id}
                            caseTitle={caseItem.title}
                            onUpdate={async (caseId, update) => {
                              try {
                                const updated = await addCaseTimelineEvent(caseId, {
                                  title: "Lawyer Update",
                                  description: update,
                                  type: "update",
                                });
                                setLawyerCases((prev) =>
                                  prev.map((c) => (c.id === caseId ? updated : c))
                                );
                              } catch (e) {
                                toast.error(e.message || "Failed to add update.");
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingCaseId === caseItem.id}
                            onClick={() => {
                              setUploadingCaseId(caseItem.id);
                              fileInputRef.current?.click();
                            }}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            {uploadingCaseId === caseItem.id ? "Uploading…" : "Upload Document"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Slots Tab */}
            <TabsContent value="slots" className="mt-6">
              <div className="grid lg:grid-cols-[360px,1fr] gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{editingSlotId ? "Update Slot" : "Create Slot"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-date">Date</Label>
                      <Input
                        id="slot-date"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={slotForm.date}
                        onChange={(e) => setSlotForm((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slot-start-time">Start Time</Label>
                      <Input
                        id="slot-start-time"
                        type="time"
                        value={slotForm.startTime}
                        onChange={(e) =>
                          setSlotForm((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                            endTime: editingSlotId ? prev.endTime : addMinutesToTime(e.target.value, 45),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slot-end-time">End Time</Label>
                      <Input
                        id="slot-end-time"
                        type="time"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSlotSubmit} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        {editingSlotId ? "Update Slot" : "Apply to Weekdays"}
                      </Button>
                      {editingSlotId && (
                        <Button variant="outline" onClick={resetSlotForm}>Cancel</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Your Slots</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleGenerateDefaultSlots} className="gap-2">
                      <Zap className="h-4 w-4" />
                      Generate 10 AM – 4 PM
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Pick one slot time and LawConnect will apply that same slot across upcoming weekdays, excluding weekends. Standard full-day generation is also available.
                    </div>
                    {slots.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-3">No slots created yet.</p>
                        <Button size="sm" onClick={handleGenerateDefaultSlots} variant="outline" className="gap-2">
                          <Zap className="h-4 w-4" />
                          Generate Standard Slots
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto">
                        {slots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between gap-4 border rounded-lg p-3 hover:bg-muted/50 transition mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <div className="font-medium text-sm">{formatDate(slot.date)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatSlot(slot.startTime, slot.endTime)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={slot.isBooked ? "secondary" : "outline"} className="text-xs">
                                {slot.isBooked ? "Booked" : "Available"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSlot(slot)}
                                disabled={slot.isBooked}
                                className="h-8 w-8 p-0"
                              >
                                ✎
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={slot.isBooked}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booked Consultations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-semibold">{booking.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.date} | {booking.timeSlot}
                            </p>
                          </div>
                          <Badge variant={booking.status === "approved" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mb-3">{booking.notes}</p>
                        )}
                        <p className="text-sm text-muted-foreground mb-3">
                          Payment:{" "}
                          <span className="font-medium capitalize text-foreground">
                            {booking.paymentStatus || "unpaid"}
                          </span>
                        </p>
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBookingStatusChange(booking.id, "approved")}>
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleBookingStatusChange(booking.id, "cancelled")}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consultation Requests Tab */}
            <TabsContent value="requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Consultation Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No pending consultation requests.</p>
                    ) : (
                      pendingBookings.map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <div>
                              <p className="font-semibold">{request.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.date} | {request.timeSlot}
                              </p>
                            </div>
                            <Badge variant="secondary">New</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {request.notes || "Consultation booking request awaiting your response."}
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Payment:{" "}
                            <span className="font-medium capitalize text-foreground">
                              {request.paymentStatus || "unpaid"}
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBookingStatusChange(request.id, "approved")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleBookingStatusChange(request.id, "cancelled")}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">This Month</p>
                          <p className="text-2xl font-bold">{formatCurrency(stats.thisMonthEarnings)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-success" />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Earnings</p>
                          <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                        </div>
                        <IndianRupee className="h-8 w-8 text-success" />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Completed Consultations</p>
                          <p className="text-2xl font-bold">{earningsData.transactionsCount}</p>
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Membership & Commission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-5xl font-bold gradient-premium bg-clip-text text-transparent mb-2">
                        {membershipLabel}
                      </div>
                      <p className="text-lg font-semibold mb-2">Membership Tier</p>
                      <Badge className="gradient-premium">{membershipLabel} Member</Badge>
                      <div className="mt-6 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bar ID</span>
                          <span className="font-medium">{currentUser?.barId || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Experience</span>
                          <span className="font-medium">{currentUser?.experience ?? 0} years</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hourly Rate</span>
                          <span className="font-medium">{formatCurrency(currentUser?.hourlyRate ?? 0)}/hr</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Tab — real data from currentUser (synced via hydrateUser) */}
            <TabsContent value="profile" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{currentUser?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{currentUser?.email || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{currentUser?.location || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bar ID</span>
                      <span className="font-medium">{currentUser?.barId || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-medium">{currentUser?.experience ?? 0} years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Specialization</span>
                      <span className="font-medium text-right">
                        {currentUser?.specialization?.join(", ") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span className="font-medium">{formatCurrency(currentUser?.hourlyRate ?? 0)}/hr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Verification</span>
                      <Badge variant={currentUser?.verified ? "default" : "secondary"}>
                        {currentUser?.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {currentUser?.bio || "No bio added yet."}
                    </p>
                    <Button className="mt-4" onClick={() => navigate("/settings")}>
                      Edit Profile & Bio
                    </Button>
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

export default LawyerDashboard;
