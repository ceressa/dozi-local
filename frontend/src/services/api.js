const API_BASE_URL = "http://localhost:5000";

// --- GENERIC API HANDLER ---
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error);
    throw error;
  }
};

/* --------------------------------------------------------
   DASHBOARD & ANALYTICS
   (Yeni grafikler ve KPI kartları için)
--------------------------------------------------------- */

// Dashboard ana sayfasındaki tüm grafik ve özet verileri
export const fetchDashboardAnalytics = () => 
  apiCall("/analytics/dashboard");

// Detaylı hatırlatma tablosu ve dedektif modu için
export const fetchAllReminders = () => 
  apiCall("/analytics/all-reminders");

/* --------------------------------------------------------
   USER MANAGEMENT
--------------------------------------------------------- */

export const fetchUsers = () => 
  apiCall("/users");

export const fetchUserDetails = (uid) => 
  apiCall(`/users/${uid}`);

export const updateUser = (uid, data) =>
  apiCall(`/users/${uid}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  

/* --------------------------------------------------------
   USER SUB-COLLECTIONS & DETAILS
--------------------------------------------------------- */

// Hatırlatma Logları (Trigger/Alarm kayıtları)
export const fetchReminderLogs = (uid) =>
  apiCall(`/users/${uid}/reminder-logs`);

// İlaç Arkadaşları
export const fetchUserBuddies = (uid) =>
  apiCall(`/users/${uid}/buddies`);

// Aile Planı Bilgisi
export const fetchUserFamily = (uid) =>
  apiCall(`/users/${uid}/family`);

// Kullanıcı İstatistikleri
export const fetchUserStats = (uid) =>
  apiCall(`/users/${uid}/stats`);
  
export const fetchUserMedicines = (uid) =>
  apiCall(`/users/${uid}/medicines`);

export const fetchUserMedicationLogs = (uid) =>
  apiCall(`/users/${uid}/medication-logs`);

export const fetchUserNotifications = (uid) =>
  apiCall(`/users/${uid}/notifications`);  

/* --------------------------------------------------------
   SYSTEM HEALTH
--------------------------------------------------------- */

export const getSystemHealth = () => 
  apiCall("/health");