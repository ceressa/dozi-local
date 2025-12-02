import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Drawer, Box, Typography, IconButton, Tabs, Tab, CircularProgress,
  Grid, Card, CardContent, Chip, List, ListItem, ListItemText, ListItemIcon,
  Avatar, Stack, Alert, Tooltip, Divider, Button, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Skeleton
} from "@mui/material";
import {
  Close, Person, Medication, History, PhoneAndroid,
  Email, VpnKey, AccessTime, Science, LocalPharmacy,
  CalendarMonth, Login, Diamond, Snooze, TrendingUp,
  NotificationsActive, CheckCircle, Cancel, HelpOutline,
  Update, Android, Apple, QuestionMark, MoreVert,
  Edit, Block, Delete as DeleteIcon, Download, Refresh,
  Assessment
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import toast from "react-hot-toast";

import {
  fetchUserDetails,
  fetchUserMedicationLogs,
  fetchUserMedicines,
  fetchReminderLogs,
  fetchUserStats
} from "../services/api";
import UserStatsCharts from "./UserStatsCharts"; 

// --- GÜÇLENDİRİLMİŞ TARİH FORMATLAYICI - Memoized ---
const formatDate = (val) => {
  if (!val) return "-";

  let dateObj;

  // 1. Firestore Timestamp ({ _seconds: 172... })
  if (typeof val === 'object' && val._seconds) {
    dateObj = new Date(val._seconds * 1000);
  }
  // 2. Timestamp Number (1727788...)
  else if (typeof val === 'number') {
    dateObj = new Date(val);
  }
  // 3. ISO String ("2025-11-28T10:00:00.000Z")
  else if (typeof val === 'string') {
    dateObj = new Date(val);
  }

  // Geçersiz tarih kontrolü
  if (!dateObj || isNaN(dateObj.getTime())) return "-";

  return dateObj.toLocaleString("tr-TR", {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Memoized CustomTabPanel
const CustomTabPanel = React.memo(function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ height: '100%' }}>
      {value === index && <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>{children}</Box>}
    </div>
  );
});

export default function UserDetailDrawer({ open, onClose, selectedUser }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [details, setDetails] = useState(null);
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [stats, setStats] = useState(null);

  // Action menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  const targetUid = selectedUser?.uid || selectedUser?.id;

  useEffect(() => {
    if (open && targetUid) {
      loadUserData(targetUid);
    }
  }, [open, targetUid]);

  const loadUserData = useCallback(async (uid, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    // Eski verileri temizle (sadece initial load'da)
    if (!silent) {
      setDetails(null);
      setMeds([]);
      setLogs([]);
      setReminderLogs([]);
      setStats(null);
    }

    try {
      const [userRes, medsRes, logsRes, remindersRes, statsRes] = await Promise.all([
        fetchUserDetails(uid).catch(() => null),
        fetchUserMedicines(uid).catch(() => []),
        fetchUserMedicationLogs(uid).catch(() => []),
        fetchReminderLogs(uid).catch(() => []),
        fetchUserStats(uid).catch(() => null)
      ]);

      setDetails(userRes || selectedUser);
      setMeds(Array.isArray(medsRes) ? medsRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
      setReminderLogs(Array.isArray(remindersRes) ? remindersRes : []);
      setStats(statsRes);

    } catch (error) {
      console.error("Veri Hatası:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUser]);

  const handleRefresh = useCallback(() => {
    if (targetUid) {
      loadUserData(targetUid, true);
      toast.success("Data refreshed");
    }
  }, [targetUid, loadUserData]);

  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
  }, []);

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!details) return;

    const userData = {
      user: details,
      medicines: meds,
      medicationLogs: logs,
      reminderLogs: reminderLogs,
      stats: stats
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-${targetUid}-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("User data exported");
    handleMenuClose();
  }, [details, meds, logs, reminderLogs, stats, targetUid, handleMenuClose]);

  const handleEdit = useCallback(() => {
    toast.info("Edit functionality coming soon");
    handleMenuClose();
  }, [handleMenuClose]);

  const handleBanConfirm = useCallback(() => {
    toast.success(`User ${details?.banned ? "unbanned" : "banned"} successfully`);
    setBanDialogOpen(false);
    handleMenuClose();
  }, [details, handleMenuClose]);

  const handleDeleteConfirm = useCallback(() => {
    toast.success("User deleted successfully");
    setDeleteDialogOpen(false);
    handleMenuClose();
    onClose();
  }, [handleMenuClose, onClose]);

  const displayUser = useMemo(() => details || selectedUser || {}, [details, selectedUser]);

  // ReminderLog'lardan cihaz bilgilerini çıkar
  const deviceInfoFromLogs = useMemo(() => {
    if (!reminderLogs || reminderLogs.length === 0) return null;

    // En son reminder log'dan cihaz bilgilerini al
    for (let i = reminderLogs.length - 1; i >= 0; i--) {
      const log = reminderLogs[i];
      if (log.deviceInfo || log.device) {
        const device = log.deviceInfo || log.device;
        return {
          model: device.model || device.deviceModel || device.brand,
          manufacturer: device.manufacturer || device.brand,
          osVersion: device.osVersion || device.systemVersion,
          platform: device.platform || (device.osVersion ? 'Android' : null),
          deviceId: device.deviceId || device.id
        };
      }
      // Alternatif: direkt log içinde olabilir
      if (log.model || log.deviceModel) {
        return {
          model: log.model || log.deviceModel,
          manufacturer: log.manufacturer || log.brand,
          osVersion: log.osVersion,
          platform: log.platform,
          deviceId: log.deviceId
        };
      }
    }
    return null;
  }, [reminderLogs]);

  // --- CİHAZ MODELİ BULUCU - ReminderLog'lardan da bak ---
  const getDeviceName = useCallback(() => {
    const u = displayUser;
    const d = deviceInfoFromLogs;

    // Önce user'dan kontrol et
    if (u.deviceModel) return u.deviceModel;
    if (u.model) return u.model;
    if (u.productName) return u.productName;
    if (u.brand && u.product) return `${u.brand} ${u.product}`.toUpperCase();
    if (u.manufacturer && u.device) return `${u.manufacturer} ${u.device}`.toUpperCase();

    // ReminderLog'lardan kontrol et
    if (d) {
      if (d.model && d.manufacturer) return `${d.manufacturer} ${d.model}`.toUpperCase();
      if (d.model) return d.model.toUpperCase();
      if (d.manufacturer) return d.manufacturer.toUpperCase();
    }

    // Eğer hiçbiri yoksa ve sadece ID varsa
    if (u.deviceId) return `Bilinmeyen Cihaz (ID: ${u.deviceId.substring(0, 6)}...)`;
    if (d?.deviceId) return `Bilinmeyen Cihaz (ID: ${d.deviceId.substring(0, 6)}...)`;

    return "Cihaz Bilgisi Yok";
  }, [displayUser, deviceInfoFromLogs]);

  const getOSInfo = useCallback(() => {
    const u = displayUser;
    const d = deviceInfoFromLogs;

    // User'dan kontrol et
    if (u.osVersion) return `Android ${u.osVersion}`;
    if (u.platform) return u.platform;

    // ReminderLog'lardan kontrol et
    if (d) {
      if (d.osVersion && d.platform === 'Android') return `Android ${d.osVersion}`;
      if (d.osVersion) return `Version ${d.osVersion}`;
      if (d.platform) return d.platform;
    }

    return "Bilinmiyor";
  }, [displayUser, deviceInfoFromLogs]);

  // Reminder Schedule Analizi - İlaç ve saat bazlı
  const reminderScheduleAnalysis = useMemo(() => {
    if (!meds || meds.length === 0 || !reminderLogs || reminderLogs.length === 0) {
      return { schedules: [], stats: {} };
    }

    const schedules = [];
    const stats = {
      totalScheduled: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      taken: 0,
      missed: 0,
      snoozed: 0,
      skipped: 0
    };

    // Her ilaç için
    meds.forEach(med => {
      if (!med.times || med.times.length === 0) return;

      // Her hatırlatma saati için
      med.times.forEach(time => {
        // Bu ilacın bu saatine ait tüm reminder log'ları bul
        const relevantLogs = reminderLogs.filter(log => {
          const logMedName = (log.medicineName || log.medName || log.medicine?.name || '').toLowerCase();
          const medName = (med.name || '').toLowerCase();

          // İlaç adı eşleşmeli
          if (!logMedName.includes(medName) && !medName.includes(logMedName)) return false;

          // Saat bilgisi varsa kontrol et
          if (log.scheduledTime || log.reminderTime) {
            const logTime = log.scheduledTime || log.reminderTime;
            if (logTime === time) return true;
          }

          // Saat bilgisi yoksa, log zamanına bak (aynı saat diliminde mi?)
          if (log.createdAt) {
            let logDate;
            if (typeof log.createdAt === 'object' && log.createdAt !== null && log.createdAt._seconds) {
              logDate = new Date(log.createdAt._seconds * 1000);
            } else if (typeof log.createdAt === 'number') {
              logDate = new Date(log.createdAt);
            } else if (typeof log.createdAt === 'string') {
              logDate = new Date(log.createdAt);
            }

            if (logDate && !isNaN(logDate.getTime())) {
              const logHour = String(logDate.getHours()).padStart(2, '0');
              const logMinute = String(logDate.getMinutes()).padStart(2, '0');
              const logTimeStr = `${logHour}:${logMinute}`;

              // Saat ±15 dakika içindeyse eşleştir
              if (isTimeClose(time, logTimeStr, 15)) return true;
            }
          }

          return false;
        });

        // Log'ları tarihe göre grupla
        const logsByDate = {};
        relevantLogs.forEach(log => {
          if (!log.createdAt) return; // createdAt yoksa skip et

          let logDate;
          if (typeof log.createdAt === 'object' && log.createdAt !== null && log.createdAt._seconds) {
            logDate = new Date(log.createdAt._seconds * 1000);
          } else if (typeof log.createdAt === 'number') {
            logDate = new Date(log.createdAt);
          } else if (typeof log.createdAt === 'string') {
            logDate = new Date(log.createdAt);
          } else {
            return; // Invalid date format, skip
          }

          if (isNaN(logDate.getTime())) return; // Invalid date, skip

          const dateKey = logDate.toISOString().split('T')[0]; // YYYY-MM-DD

          if (!logsByDate[dateKey]) {
            logsByDate[dateKey] = [];
          }
          logsByDate[dateKey].push(log);
        });

        // Her gün için analiz
        Object.keys(logsByDate).sort().reverse().slice(0, 7).forEach(dateKey => { // Son 7 gün
          const dayLogs = logsByDate[dateKey];

          stats.totalScheduled++;

          // Bildirim gönderildi mi?
          const notificationLog = dayLogs.find(l =>
            (l.eventType || l.type || '').toUpperCase().includes('NOTIFICATION_SENT') ||
            (l.eventType || l.type || '').toUpperCase().includes('SENT')
          );

          let notificationStatus = 'not-sent';
          let notificationError = null;

          if (notificationLog) {
            if (notificationLog.success === false || notificationLog.error) {
              notificationStatus = 'failed';
              notificationError = notificationLog.error || notificationLog.errorMessage || 'Unknown error';
              stats.notificationsFailed++;
            } else {
              notificationStatus = 'sent';
              stats.notificationsSent++;
            }
          }

          // Kullanıcı ne yaptı?
          const userAction = dayLogs.find(l => {
            const type = (l.eventType || l.type || '').toUpperCase();
            return type === 'TAKEN' || type.includes('MEDICATION_TAKEN') ||
                   type === 'MISSED' || type.includes('MEDICATION_MISSED') ||
                   type === 'SKIPPED' || type.includes('MEDICATION_SKIPPED') ||
                   type.includes('SNOOZE');
          });

          let action = 'no-action';
          if (userAction) {
            const type = (userAction.eventType || userAction.type || '').toUpperCase();
            if (type === 'TAKEN' || type.includes('MEDICATION_TAKEN')) {
              action = 'taken';
              stats.taken++;
            } else if (type === 'MISSED' || type.includes('MEDICATION_MISSED')) {
              action = 'missed';
              stats.missed++;
            } else if (type === 'SKIPPED' || type.includes('MEDICATION_SKIPPED')) {
              action = 'skipped';
              stats.skipped++;
            } else if (type.includes('SNOOZE')) {
              action = 'snoozed';
              stats.snoozed++;
            }
          }

          schedules.push({
            date: dateKey,
            time: time,
            medicineName: med.name,
            medicineColor: med.color,
            notificationStatus,
            notificationError,
            userAction,
            action,
            allLogs: dayLogs
          });
        });
      });
    });

    return { schedules, stats };
  }, [meds, reminderLogs]);

  // Saat karşılaştırma yardımcı fonksiyonu
  const isTimeClose = (time1, time2, minuteThreshold) => {
    try {
      const [h1, m1] = time1.split(':').map(Number);
      const [h2, m2] = time2.split(':').map(Number);

      const totalMin1 = h1 * 60 + m1;
      const totalMin2 = h2 * 60 + m2;

      return Math.abs(totalMin1 - totalMin2) <= minuteThreshold;
    } catch {
      return false;
    }
  };

  // --- TABLO: HATIRLATMA RAPORU - Schedule-Based ---
  const reminderReportColumns = useMemo(() => [
    {
      field: 'date',
      headerName: 'Tarih',
      width: 120,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    },
    {
      field: 'time',
      headerName: 'Saat',
      width: 90
    },
    {
      field: 'medicineName',
      headerName: 'İlaç',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.medicineColor && (
            <Box sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: params.row.medicineColor.toLowerCase(),
              border: '1px solid',
              borderColor: 'divider'
            }} />
          )}
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'notificationStatus',
      headerName: 'Bildirim Durumu',
      width: 200,
      renderCell: (params) => {
        const status = params.value;

        if (status === 'sent') {
          return <Chip icon={<CheckCircle />} label="✓ Bildirim Gönderildi" color="success" size="small" sx={{ fontWeight: 600 }} />;
        } else if (status === 'failed') {
          return <Chip icon={<Cancel />} label="✗ Gönderilemedi" color="error" size="small" sx={{ fontWeight: 600 }} />;
        } else {
          return <Chip icon={<HelpOutline />} label="? Bildirim Yok" color="default" size="small" />;
        }
      }
    },
    {
      field: 'action',
      headerName: 'Kullanıcı Aksiyonu',
      width: 170,
      renderCell: (params) => {
        const action = params.value;

        if (action === 'taken') {
          return <Chip icon={<CheckCircle />} label="İlaç Alındı" color="success" size="small" variant="filled" />;
        } else if (action === 'missed') {
          return <Chip icon={<Cancel />} label="Kaçırıldı" color="error" size="small" variant="filled" />;
        } else if (action === 'skipped') {
          return <Chip icon={<Cancel />} label="Atladı" color="warning" size="small" variant="outlined" />;
        } else if (action === 'snoozed') {
          return <Chip icon={<Snooze />} label="Erteledi" color="info" size="small" variant="outlined" />;
        } else {
          return <Chip label="Aksiyon Yok" color="default" size="small" variant="outlined" />;
        }
      }
    },
    {
      field: 'notificationError',
      headerName: 'Hata/Detay',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const error = params.value;
        const logs = params.row.allLogs || [];

        if (error) {
          return (
            <Tooltip title={error}>
              <Typography variant="caption" color="error.main" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                display: 'block',
                fontWeight: 600
              }}>
                {error}
              </Typography>
            </Tooltip>
          );
        }

        // Hata yoksa, log sayısını göster
        return (
          <Typography variant="caption" color="text.secondary">
            {logs.length} olay kaydı
          </Typography>
        );
      }
    }
  ], []);

  // --- TABLO: İLAÇ GEÇMİŞİ - Memoized ---
  const historyColumns = useMemo(() => [
    { field: 'createdAt', headerName: 'Kayıt Tarihi', width: 160, valueFormatter: (params) => formatDate(params.value) },
    { field: 'medicineName', headerName: 'İlaç', width: 150 },
    {
      field: 'status', headerName: 'Durum', width: 130,
      renderCell: (params) => {
        const val = params.value;
        let color = "default";
        if (val === "TAKEN") color = "success";
        else if (val === "SKIPPED") color = "warning";
        else if (val?.includes("MISSED")) color = "error";
        return <Chip label={val} color={color} size="small" variant="outlined" />
      }
    }
  ], []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", md: 950 } } }}
    >
      {/* HEADER */}
      <Box sx={{ p: 3, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: 32, boxShadow: 2 }}>
              {displayUser.name?.charAt(0).toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="800">
                {displayUser.name || "İsimsiz Kullanıcı"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                {displayUser.email}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={displayUser.isPremium ? <Diamond fontSize="small" /> : null}
                  label={displayUser.isPremium ? "PREMIUM ÜYE" : "ÜCRETSİZ PLAN"}
                  color={displayUser.isPremium ? "secondary" : "default"}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={displayUser.banned ? "YASAKLI" : "AKTİF"}
                  color={displayUser.banned ? "error" : "success"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Actions">
              <IconButton onClick={handleMenuOpen} size="small" sx={{ bgcolor: 'action.hover' }}>
                <MoreVert />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* İSTATİSTİK BAR */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Kayıt Tarihi</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarMonth fontSize="small" color="action"/>
                        {/* createdAt veya registerDate kontrolü */}
                        <Typography variant="body2" fontWeight="600">{formatDate(displayUser.createdAt || displayUser.registerDate)}</Typography>
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Son Giriş</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Login fontSize="small" color="action"/>
                        <Typography variant="body2" fontWeight="600">{formatDate(displayUser.lastLoginAt || displayUser.lastSeen)}</Typography>
                    </Box>
                </Box>
            </Grid>
            {displayUser.isPremium && (
                <>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }} display="block">Premium Başlangıç</Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatDate(displayUser.premiumStartDate || displayUser.premiumStart || displayUser.subscriptionStart)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }} display="block">Premium Bitiş</Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatDate(displayUser.premiumEndDate || displayUser.premiumEnd || displayUser.subscriptionEnd)}
                        </Typography>
                    </Box>
                </Grid>
                </>
            )}
        </Grid>
      </Box>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
        <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<Person />} iconPosition="start" label="Cihaz & Profil" />
          <Tab icon={<Assessment />} iconPosition="start" label="İstatistikler" />
          <Tab icon={<Medication />} iconPosition="start" label={`İlaçlar (${meds.length})`} />
          <Tab icon={<NotificationsActive />} iconPosition="start" label={`Hatırlatma Raporu (${reminderScheduleAnalysis.schedules.length})`} />
          <Tab icon={<History />} iconPosition="start" label={`Geçmiş (${logs.length})`} />
        </Tabs>
      </Box>

      {/* CONTENT AREA */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', bgcolor: '#f8f9fa' }}>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">Veriler Getiriliyor...</Typography>
          </Box>
        ) : (
          <>
            {/* 1. PROFİL & CİHAZ */}
            <CustomTabPanel value={tabIndex} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="overline" color="text.secondary" fontWeight="bold">CİHAZ BİLGİLERİ</Typography>
                                    <List>
                                        <ListItem divider>
                                            <ListItemIcon><PhoneAndroid color="primary" /></ListItemIcon>
                                            <ListItemText 
                                                primary="Model / Cihaz Adı" 
                                                secondary={getDeviceName()} 
                                                secondaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary', fontSize: '1.1rem' }}
                                            />
                                        </ListItem>
                                        <ListItem divider>
                                            <ListItemIcon>
                                                {getOSInfo().includes('iOS') ? <Apple/> : <Android color="success"/>}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary="İşletim Sistemi" 
                                                secondary={getOSInfo()} 
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><AccessTime color="action" /></ListItemIcon>
                                            <ListItemText 
                                                primary="Saat Dilimi" 
                                                secondary={displayUser.timezone || "Europe/Istanbul"} 
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="overline" color="text.secondary" fontWeight="bold">HESAP DETAYLARI</Typography>
                                    <List>
                                        <ListItem divider>
                                            <ListItemIcon><VpnKey color="action" /></ListItemIcon>
                                            <ListItemText primary="User UID" secondary={displayUser.uid || displayUser.id} secondaryTypographyProps={{ fontFamily: 'monospace' }} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><Email color="action" /></ListItemIcon>
                                            <ListItemText primary="İletişim Email" secondary={displayUser.email} />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </CustomTabPanel>

                {/* 2. İSTATİSTİKLER */}
                <CustomTabPanel value={tabIndex} index={1}>
                  {stats ? (
                    <UserStatsCharts stats={stats} />
                  ) : (
                    <Alert severity="info" variant="outlined">
                      No statistics available for this user
                    </Alert>
                  )}
                </CustomTabPanel>

                {/* 3. İLAÇLAR */}
                <CustomTabPanel value={tabIndex} index={2}>
                    {meds.length === 0 ? (
                        <Alert severity="warning" variant="outlined" icon={<HelpOutline/>}>Bu kullanıcının aktif ilacı yok.</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {meds.map((med, i) => (
                                <Grid item xs={12} key={i}>
                                    <Card sx={{ p: 2, borderRadius: 3, boxShadow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Avatar sx={{ bgcolor: med.color ? med.color.toLowerCase() : 'primary.light', mr: 2, width: 48, height: 48 }}>
                                                {med.icon || <LocalPharmacy />}
                                            </Avatar>
                                            
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                        {med.name}
                                                    </Typography>
                                                    <Chip 
                                                        label={med.active !== false ? "AKTİF" : "PASİF"} 
                                                        color={med.active !== false ? "success" : "default"} 
                                                        size="small" 
                                                        sx={{ height: 20, fontSize: 10, ml: 1 }}
                                                    />
                                                </Box>

                                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                                                    {med.dosage && (
                                                        <Chip label={`${med.dosage} ${med.unit || ''}`} size="small" variant="outlined" icon={<Science sx={{ fontSize: 14 }}/>} />
                                                    )}
                                                    {med.form && (
                                                        <Chip label={med.form} size="small" variant="outlined" />
                                                    )}
                                                    {med.frequency && (
                                                         <Chip label={med.frequency} size="small" color="primary" variant="outlined" />
                                                    )}
                                                </Stack>

                                                <Divider sx={{ my: 1.5 }} />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                                        Hatırlatmalar:
                                                    </Typography>
                                                    
                                                    {med.times && med.times.length > 0 ? (
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                            {med.times.map((t, idx) => (
                                                                <Chip key={idx} label={t} size="small" sx={{ height: 22, fontSize: 11, bgcolor: 'action.hover', fontWeight: 600 }} />
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary" fontStyle="italic">Planlanmış saat yok</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </CustomTabPanel>

                {/* 4. HATIRLATMA ANALİZİ - Schedule-Based Report */}
                <CustomTabPanel value={tabIndex} index={3}>
                     <Alert severity="info" sx={{ mb: 2 }} icon={<NotificationsActive />}>
                        <strong>Hatırlatma Raporu:</strong> Her satır bir ilacın planlanmış hatırlatma saatini gösterir.
                        Bildirim gönderildi mi? Kullanıcı ne yaptı? Hata var mı? Tüm detaylar burada.
                     </Alert>

                     {/* İstatistik Kartları */}
                     <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderScheduleAnalysis.stats.totalScheduled}</Typography>
                            <Typography variant="caption">Toplam Hatırlatma</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderScheduleAnalysis.stats.notificationsSent}</Typography>
                            <Typography variant="caption">Bildirim Gitti</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderScheduleAnalysis.stats.notificationsFailed}</Typography>
                            <Typography variant="caption">Bildirim Hatası</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.dark', color: '#fff' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderScheduleAnalysis.stats.taken}</Typography>
                            <Typography variant="caption">İlaç Alındı</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.dark', color: '#fff' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderScheduleAnalysis.stats.missed}</Typography>
                            <Typography variant="caption">Kaçırıldı</Typography>
                          </Card>
                        </Grid>
                     </Grid>

                     {/* Özet Metrikler */}
                     <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Card sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Typography variant="caption" color="text.secondary">Bildirim Başarı Oranı</Typography>
                            <Typography variant="h5" fontWeight="bold" color={
                              reminderScheduleAnalysis.stats.totalScheduled > 0
                                ? (reminderScheduleAnalysis.stats.notificationsSent / reminderScheduleAnalysis.stats.totalScheduled) > 0.8
                                  ? 'success.main'
                                  : 'warning.main'
                                : 'text.secondary'
                            }>
                              {reminderScheduleAnalysis.stats.totalScheduled > 0
                                ? `${Math.round((reminderScheduleAnalysis.stats.notificationsSent / reminderScheduleAnalysis.stats.totalScheduled) * 100)}%`
                                : '-'}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Card sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Typography variant="caption" color="text.secondary">Uyum Oranı (İlaç Alma)</Typography>
                            <Typography variant="h5" fontWeight="bold" color={
                              reminderScheduleAnalysis.stats.totalScheduled > 0
                                ? (reminderScheduleAnalysis.stats.taken / reminderScheduleAnalysis.stats.totalScheduled) > 0.7
                                  ? 'success.main'
                                  : 'error.main'
                                : 'text.secondary'
                            }>
                              {reminderScheduleAnalysis.stats.totalScheduled > 0
                                ? `${Math.round((reminderScheduleAnalysis.stats.taken / reminderScheduleAnalysis.stats.totalScheduled) * 100)}%`
                                : '-'}
                            </Typography>
                          </Card>
                        </Grid>
                     </Grid>

                     <Card sx={{ height: 500, borderRadius: 2 }}>
                        <DataGrid
                            rows={reminderScheduleAnalysis.schedules.map((s, i) => ({ id: `${s.date}-${s.time}-${s.medicineName}-${i}`, ...s }))}
                            columns={reminderReportColumns}
                            initialState={{
                                sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                                pagination: { paginationModel: { pageSize: 25 } }
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            disableRowSelectionOnClick
                            density="comfortable"
                            sx={{
                              '& .MuiDataGrid-row:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                        />
                    </Card>
                </CustomTabPanel>

                {/* 5. İÇİM GEÇMİŞİ */}
                <CustomTabPanel value={tabIndex} index={4}>
                    <Card sx={{ height: 600, borderRadius: 2 }}>
                        <DataGrid
                            rows={logs.map((l, i) => ({ id: l.id || i, ...l }))}
                            columns={historyColumns}
                            initialState={{
                                sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
                                pagination: { paginationModel: { pageSize: 50 } }
                            }}
                            pageSizeOptions={[50, 100]}
                            disableRowSelectionOnClick
                            density="comfortable"
                        />
                    </Card>
                </CustomTabPanel>
            </>
        )}
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>Export Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setBanDialogOpen(true); handleMenuClose(); }} sx={{ color: "warning.main" }}>
          <ListItemIcon><Block fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>{displayUser.banned ? "Unban User" : "Ban User"}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>{displayUser.banned ? "Unban User?" : "Ban User?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {displayUser.banned
              ? `Are you sure you want to unban ${displayUser.name || "this user"}? They will regain access to the platform.`
              : `Are you sure you want to ban ${displayUser.name || "this user"}? They will lose access to the platform.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBanConfirm} color={displayUser.banned ? "success" : "warning"} variant="contained">
            {displayUser.banned ? "Unban" : "Ban"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {displayUser.name || "this user"}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}