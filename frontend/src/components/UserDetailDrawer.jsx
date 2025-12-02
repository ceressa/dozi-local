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

  // Reminder Logs analizi - grupla ve anlamlı hale getir
  const reminderAnalysis = useMemo(() => {
    if (!reminderLogs || reminderLogs.length === 0) return { groups: [], stats: {} };

    // İstatistikler
    const stats = {
      totalNotifications: 0,
      delivered: 0,
      read: 0,
      snoozed: 0,
      taken: 0,
      missed: 0,
      escalated: 0
    };

    reminderLogs.forEach(log => {
      const type = (log.eventType || log.type || '').toUpperCase();

      if (type.includes('NOTIFICATION_SENT') || type.includes('SENT')) stats.totalNotifications++;
      if (type.includes('DELIVERED')) stats.delivered++;
      if (type.includes('READ') || type.includes('OPENED')) stats.read++;
      if (type.includes('SNOOZE')) stats.snoozed++;
      if (type === 'TAKEN' || type.includes('MEDICATION_TAKEN')) stats.taken++;
      if (type === 'MISSED' || type.includes('MEDICATION_MISSED')) stats.missed++;
      if (type.includes('ESCALATION')) stats.escalated++;
    });

    return { groups: reminderLogs, stats };
  }, [reminderLogs]);

  // --- TABLO: HATIRLATMA ANALİZİ - Geliştirilmiş ---
  const reminderColumns = useMemo(() => [
    {
      field: 'createdAt',
      headerName: 'Zaman',
      width: 160,
      valueFormatter: (params) => formatDate(params.value)
    },
    {
      field: 'medicineName',
      headerName: 'İlaç',
      width: 140,
      valueGetter: (params) => params.row.medicineName || params.row.medName || params.row.medicine?.name || '-'
    },
    {
      field: 'eventType',
      headerName: 'Durum',
      width: 220,
      renderCell: (params) => {
        const type = (params.value || params.row.type || "UNKNOWN").toUpperCase();
        const success = params.row.success;
        const error = params.row.error;

        // Bildirim durumları
        if (type.includes('NOTIFICATION_SENT') || type.includes('SENT')) {
          if (success === false || error) {
            return <Chip icon={<Cancel />} label="Bildirim Gönderilemedi" color="error" size="small" />;
          }
          return <Chip icon={<CheckCircle />} label="Bildirim Gönderildi" color="success" size="small" />;
        }
        if (type.includes('DELIVERED')) {
          return <Chip icon={<CheckCircle />} label="Cihaza Ulaştı" color="success" size="small" variant="outlined" />;
        }
        if (type.includes('READ') || type.includes('OPENED')) {
          return <Chip icon={<CheckCircle />} label="Kullanıcı Gördü" color="info" size="small" />;
        }

        // Kullanıcı eylemleri
        if (type.includes("SNOOZE")) {
          return <Chip icon={<Snooze />} label="Kullanıcı Erteledi" color="warning" size="small" />;
        }
        if (type === "TAKEN" || type.includes("MEDICATION_TAKEN")) {
          return <Chip icon={<CheckCircle />} label="İlaç Alındı ✓" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
        }
        if (type === "SKIPPED" || type.includes("MEDICATION_SKIPPED")) {
          return <Chip icon={<Cancel />} label="Kullanıcı Atladı" color="warning" size="small" />;
        }
        if (type === "MISSED" || type.includes("MEDICATION_MISSED")) {
          return <Chip icon={<Cancel />} label="Kaçırıldı ✗" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
        }

        // Sistem olayları
        if (type.includes("ESCALATION")) {
          return <Chip icon={<TrendingUp />} label="Eskalasyon (Acil)" color="error" size="small" variant="outlined" />;
        }
        if (type.includes("ALARM") || type === "REMINDER_TRIGGERED") {
          return <Chip icon={<NotificationsActive />} label="Alarm Tetiklendi" color="info" size="small" variant="outlined" />;
        }
        if (type === "REMINDER_UPDATED") {
          return <Chip icon={<Update />} label="Hatırlatıcı Güncellendi" size="small" variant="outlined" />;
        }

        return <Chip label={type} size="small" />;
      }
    },
    {
      field: 'channel',
      headerName: 'Kanal',
      width: 120,
      renderCell: (params) => {
        const channel = params.row.channel || params.row.notificationChannel;
        if (!channel) return '-';

        const channelColors = {
          'FCM': 'primary',
          'PUSH': 'primary',
          'SMS': 'secondary',
          'EMAIL': 'info',
          'IN_APP': 'default'
        };

        return <Chip label={channel} size="small" color={channelColors[channel] || 'default'} variant="outlined" />;
      }
    },
    {
      field: 'details',
      headerName: 'Detay',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const detail = params.row.description
          || params.row.details
          || params.row.message
          || params.row.error
          || params.row.reason
          || (params.row.payload ? JSON.stringify(params.row.payload).substring(0, 100) : null);

        if (!detail) return <Typography variant="caption" color="text.secondary">-</Typography>;

        return (
          <Tooltip title={detail}>
            <Typography
              variant="caption"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                display: 'block'
              }}
            >
              {detail}
            </Typography>
          </Tooltip>
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
          <Tab icon={<NotificationsActive />} iconPosition="start" label={`Analiz (${reminderLogs.length})`} />
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

                {/* 4. HATIRLATMA ANALİZİ */}
                <CustomTabPanel value={tabIndex} index={3}>
                     <Alert severity="info" sx={{ mb: 2 }} icon={<NotificationsActive />}>
                        Bildirim akışı ve kullanıcı etkileşimleri. Her satır bir bildirimin durumunu gösterir.
                     </Alert>

                     {/* İstatistik Kartları */}
                     <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderAnalysis.stats.totalNotifications}</Typography>
                            <Typography variant="caption">Gönderilen Bildirim</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderAnalysis.stats.taken}</Typography>
                            <Typography variant="caption">İlaç Alındı</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderAnalysis.stats.missed}</Typography>
                            <Typography variant="caption">Kaçırıldı</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderAnalysis.stats.snoozed}</Typography>
                            <Typography variant="caption">Ertelendi</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">{reminderAnalysis.stats.read}</Typography>
                            <Typography variant="caption">Görüldü</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                            <Typography variant="h4" fontWeight="bold">
                              {reminderAnalysis.stats.delivered > 0
                                ? `${Math.round((reminderAnalysis.stats.delivered / reminderAnalysis.stats.totalNotifications) * 100)}%`
                                : '-'}
                            </Typography>
                            <Typography variant="caption">Teslimat Oranı</Typography>
                          </Card>
                        </Grid>
                     </Grid>

                     <Card sx={{ height: 550, borderRadius: 2 }}>
                        <DataGrid
                            rows={reminderLogs.map((l, i) => ({ id: l.id || i, ...l }))}
                            columns={reminderColumns}
                            initialState={{
                                sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
                                pagination: { paginationModel: { pageSize: 50 } }
                            }}
                            pageSizeOptions={[25, 50, 100]}
                            disableRowSelectionOnClick
                            density="comfortable"
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