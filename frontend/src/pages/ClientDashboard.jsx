import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CaseUpdateDialog } from "@/components/CaseUpdateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

import {
  addCaseTimelineEvent,
  cancelBooking,
  fetchBookings,
  fetchCases,
  fetchMessages,
  uploadDocument,
} from "@/lib/dataService";
import { LawyerSuggestions } from "@/components/LawyerSuggestions";
import { socket } from "@/lib/socketClient";
import {
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingCaseId, setUploadingCaseId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [casesData, bookingsData, messagesData] = await Promise.all([
          fetchCases(),
          fetchBookings().catch(() => []),
          fetchMessages().catch(() => []),
        ]);
        if (isMounted) {
          setCases(casesData);
          setBookings(bookingsData || []);
          setMessages(messagesData || []);
        }
      } catch (error) {
        toast.error(error.message || "Unable to load dashboard data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    socket.connect();
    socket.emit("join", currentUser.id);

    const handleCaseUpdate = (updatedCase) => {
      setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    };
    socket.on("case_update", handleCaseUpdate);
    socket.on("timeline_update", handleCaseUpdate);

    const handleBookingUpdate = (updatedBooking) => {
      setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
    };
    socket.on("booking_updated", handleBookingUpdate);

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        const msgId = newMsg._id || newMsg.id;
        if (prev.some((m) => (m._id || m.id) === msgId)) return prev;
        return [newMsg, ...prev];
      });
    };
    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.off("case_update", handleCaseUpdate);
      socket.off("timeline_update", handleCaseUpdate);
      socket.off("booking_updated", handleBookingUpdate);
      socket.off("receive_message", handleNewMessage);
    };
  }, [currentUser?.id]);

  // ── Derived stats (all real) ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    activeCases: cases.filter((c) => c.status === "active").length,
    documents: cases.reduce((n, c) => n + (c.documents?.length ?? 0), 0),
    hearings: cases.reduce((n, c) => n + (c.hearingDates?.length ?? 0), 0),
    bookings: bookings.filter((b) => b.status !== "cancelled").length,
    unreadMessages: messages.filter(
      (m) => m.receiverId === currentUser?.id && !m.read
    ).length,
  }), [cases, bookings, messages, currentUser?.id]);

  // ── Real messages preview: group by partner, pick most recent per partner ─
  const messageConversations = useMemo(() => {
    if (!currentUser?.id) return [];
    const byPartner = new Map();

    messages.forEach((msg) => {
      const isMine = msg.senderId === currentUser.id;
      const partnerId = isMine ? msg.receiverId : msg.senderId;
      const partnerName = isMine ? (msg.receiverName || "Lawyer") : (msg.senderName || "Lawyer");
      const ts = new Date(msg.timestamp).getTime();

      if (!byPartner.has(partnerId) || byPartner.get(partnerId).ts < ts) {
        byPartner.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg.content || (msg.attachment ? "📎 Attachment" : ""),
          ts,
          unread: !isMine && !msg.read,
        });
      }
    });

    return Array.from(byPartner.values()).sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [messages, currentUser?.id]);

  // ── All documents across cases ────────────────────────────────────────────
  const allDocuments = useMemo(() =>
    cases.flatMap((c) =>
      (c.documents || []).map((doc) => ({ ...doc, caseTitle: c.title, caseId: c.id }))
    ),
  [cases]);

  // ── Case update handler ───────────────────────────────────────────────────
  const handleCaseUpdate = async (caseId, update) => {
    try {
      const updated = await addCaseTimelineEvent(caseId, {
        title: "Progress Update",
        description: update,
        type: "update",
      });
      if (updated) {
        setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      }
    } catch (error) {
      toast.error(error.message || "Failed to add update.");
    }
  };

  // ── Document upload ───────────────────────────────────────────────────────
  const handleDocumentUpload = async (caseId, file) => {
    if (!file) return;
    try {
      setUploadingCaseId(caseId);
      await uploadDocument(file);
      toast.success(`"${file.name}" uploaded.`);
      // Refresh cases to get updated document list
      const updated = await fetchCases().catch(() => cases);
      setCases(updated);
    } catch (error) {
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setUploadingCaseId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Download document ─────────────────────────────────────────────────────
  const handleDocumentDownload = (doc) => {
    if (!doc.url) {
      toast.error("Download URL not available for this document.");
      return;
    }
    const link = document.createElement("a");
    link.href = doc.url;
    link.setAttribute("download", doc.name || "document");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Cancel booking ────────────────────────────────────────────────────────
  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled.");
    } catch (error) {
      toast.error(error.message || "Failed to cancel booking.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Hidden file input for document upload */}
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
        <div className="gradient-hero py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">
              Welcome back, {currentUser?.name || "Client"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your cases, documents, hearings, and conversations in one place.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                    <p className="text-2xl font-bold">{stats.activeCases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/bookings")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bookings</p>
                    <p className="text-2xl font-bold">{stats.bookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/messages")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unread Messages</p>
                    <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold">{stats.documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Hearings</p>
                    <p className="text-2xl font-bold">{stats.hearings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="cases" className="w-full">
            <TabsList>
              <TabsTrigger value="cases">My Cases</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            {/* ── Cases Tab ─────────────────────────────────────────────── */}
            <TabsContent value="cases" className="mt-6 space-y-4">
              {isLoading ? (
                <Card><CardContent className="p-6 text-muted-foreground">Loading cases...</CardContent></Card>
              ) : cases.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-muted-foreground">
                    No active cases yet. Once you start a consultation, your case timeline will show up here.
                  </CardContent>
                </Card>
              ) : (
                cases.map((caseItem) => (
                  <Card key={caseItem.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{caseItem.title}</CardTitle>
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
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">{fmtDate(caseItem.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Documents</p>
                            <p className="text-sm font-medium">{caseItem.documents?.length ?? 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium">{fmtDate(caseItem.updatedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      {caseItem.timeline?.length > 0 && (
                        <div className="border-t pt-4 mb-4">
                          <h4 className="font-semibold mb-3">Case Timeline</h4>
                          <div className="space-y-3">
                            {caseItem.timeline.map((event) => (
                              <div key={event.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                  <div className="w-px h-full bg-border" />
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-muted-foreground">{event.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => navigate("/messages")}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Lawyer
                        </Button>
                        <CaseUpdateDialog
                          caseId={caseItem.id}
                          caseTitle={caseItem.title}
                          onUpdate={handleCaseUpdate}
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
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingCaseId === caseItem.id ? "Uploading…" : "Upload Doc"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* ── Documents Tab ─────────────────────────────────────────── */}
            <TabsContent value="documents" className="space-y-4 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Case Documents</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cases.length === 0}
                    onClick={() => {
                      if (cases[0]) {
                        setUploadingCaseId(cases[0].id);
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardHeader>
                <CardContent>
                  {allDocuments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No documents uploaded yet. Use the button above or "Upload Doc" on a case.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB · ` : ""}
                                {fmtDate(doc.uploadedAt)} · Case: {doc.caseTitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-3">
                            {doc.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Open in new tab"
                                onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Download"
                              onClick={() => handleDocumentDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Messages Tab — real previews ──────────────────────────── */}
            <TabsContent value="messages" className="space-y-4 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Messages</CardTitle>
                  <Button size="sm" onClick={() => navigate("/messages")}>
                    Open Chat
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading messages…</p>
                  ) : messageConversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No messages yet. Book a consultation to start messaging your lawyer.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messageConversations.map((conv) => (
                        <div
                          key={conv.partnerId}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate("/messages")}
                        >
                          <div className="flex items-start justify-between mb-1 gap-4">
                            <p className="font-semibold">{conv.partnerName}</p>
                            {conv.unread && <Badge>New</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.ts).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Calendar Tab ──────────────────────────────────────────── */}
            <TabsContent value="calendar" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Hearings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cases.flatMap((c) => c.hearingDates || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming hearings scheduled.</p>
                    ) : (
                      <div className="space-y-4">
                        {cases.flatMap((caseItem) =>
                          (caseItem.hearingDates || []).map((hearing, idx) => (
                            <div
                              key={hearing.id || `${caseItem.id}-${idx}`}
                              className="flex items-start gap-4 p-4 border rounded-lg"
                            >
                              <CalendarIcon className="h-5 w-5 text-primary mt-1" />
                              <div className="flex-1">
                                <h4 className="font-semibold">{caseItem.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {hearing.date} | {hearing.title}
                                </p>
                                <p className="text-sm text-muted-foreground">{hearing.location}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Bookings Tab — real data ───────────────────────────────── */}
            <TabsContent value="bookings" className="space-y-4 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Consultation Bookings</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/bookings")}>
                    Full View
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading bookings…</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No bookings yet.{" "}
                      <span
                        className="text-primary underline cursor-pointer"
                        onClick={() => navigate("/lawyers")}
                      >
                        Find a lawyer
                      </span>{" "}
                      to book a consultation.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-semibold">{booking.lawyerName || "Lawyer"}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.date} | {booking.timeSlot}
                              </p>
                            </div>
                            <Badge
                              variant={
                                booking.status === "approved"
                                  ? "default"
                                  : booking.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          {booking.notes && (
                            <p className="text-sm text-muted-foreground mb-2">{booking.notes}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Payment:{" "}
                              <span className="font-medium capitalize text-foreground">
                                {booking.paymentStatus || "unpaid"}
                              </span>
                            </p>
                            {booking.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <LawyerSuggestions />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
