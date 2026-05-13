import { apiRequest } from "@/lib/apiClient";

const fetchLawyers = async (filters = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") {
      searchParams.set(key, value);
    }
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await apiRequest(`/lawyers${suffix}`);
  return response.lawyers || [];
};

const fetchLawyerById = async (id) => {
  return await apiRequest(`/lawyers/${id}`);
};

const fetchCases = async () => {
  const response = await apiRequest("/cases", { auth: true });
  return response.cases || [];
};

const fetchMessages = async () => {
  const response = await apiRequest("/messages", { auth: true });
  return response.messages || [];
};

const createMessage = async (payload) => {
  const response = await apiRequest("/messages", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return response.message;
};

const fetchAdminOverview = async () => {
  return await apiRequest("/admin/overview", { auth: true });
};

const updateLawyerVerification = async (id, verified) => {
  const response = await apiRequest(`/admin/lawyers/${id}/verification`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ verified }),
  });
  return response.lawyer;
};

const updateTransactionStatus = async (id, status) => {
  const response = await apiRequest(`/admin/transactions/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
  return response.transaction;
};

const createCaseRequest = async (payload) => {
  const response = await apiRequest("/cases", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return response.caseItem;
};

const updateCaseStatus = async (id, status) => {
  const response = await apiRequest(`/cases/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
  return response.caseItem;
};

const addCaseTimelineEvent = async (id, payload) => {
  const response = await apiRequest(`/cases/${id}/timeline`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return response.caseItem;
};

const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("document", file);

  const response = await apiRequest("/upload", {
    method: "POST",
    auth: true,
    body: formData,
  });

  return response;
};

const fetchBookings = async () => {
  const response = await apiRequest("/bookings", { auth: true });
  return response.bookings || [];
};

const createBooking = async (payload) => {
  const response = await apiRequest("/bookings", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return response.booking;
};

const payForBooking = async (id, method) => {
  const response = await apiRequest(`/bookings/${id}/pay`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ method }),
  });
  return response.booking;
};

const updateBookingStatus = async (id, status) => {
  const response = await apiRequest(`/bookings/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
  return response.booking;
};

const cancelBooking = async (id) => {
  const response = await apiRequest(`/bookings/${id}`, {
    method: "DELETE",
    auth: true,
  });
  return response.booking;
};

const fetchNotifications = async () => {
  return await apiRequest("/notifications", { auth: true });
};

const markAllNotificationsRead = async () => {
  return await apiRequest("/notifications/read-all", {
    method: "PATCH",
    auth: true,
  });
};

const markNotificationRead = async (id) => {
  return await apiRequest(`/notifications/${id}/read`, {
    method: "PATCH",
    auth: true,
  });
};

const submitReview = async (payload) => {
  const response = await apiRequest("/reviews", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return response.review;
};

const fetchLawyerEarnings = async () => {
  return await apiRequest("/lawyers/me/earnings", { auth: true });
};

const fetchLawyerSlots = async () => {
  const response = await apiRequest("/lawyers/me/slots", { auth: true });
  return response.slots || [];
};

const createLawyerSlot = async (payload) => {
  return await apiRequest("/lawyers/me/slots", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
};

const updateLawyerSlot = async (slotId, payload) => {
  return await apiRequest(`/lawyers/me/slots/${slotId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
};

const deleteLawyerSlot = async (slotId) => {
  return await apiRequest(`/lawyers/me/slots/${slotId}`, {
    method: "DELETE",
    auth: true,
  });
};

const deleteLawyerByAdmin = async (id) => {
  return await apiRequest(`/admin/lawyers/${id}`, {
    method: "DELETE",
    auth: true,
  });
};

const deleteLawyerSlotByAdmin = async (lawyerId, slotId) => {
  return await apiRequest(`/admin/lawyers/${lawyerId}/slots/${slotId}`, {
    method: "DELETE",
    auth: true,
  });
};

export {
  uploadDocument,
  createMessage,
  createCaseRequest,
  updateCaseStatus,
  addCaseTimelineEvent,
  fetchAdminOverview,
  fetchCases,
  fetchLawyerById,
  fetchLawyers,
  fetchMessages,
  updateLawyerVerification,
  updateTransactionStatus,
  fetchBookings,
  createBooking,
  payForBooking,
  updateBookingStatus,
  cancelBooking,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  submitReview,
  fetchLawyerEarnings,
  fetchLawyerSlots,
  createLawyerSlot,
  updateLawyerSlot,
  deleteLawyerSlot,
  deleteLawyerByAdmin,
  deleteLawyerSlotByAdmin,
};
