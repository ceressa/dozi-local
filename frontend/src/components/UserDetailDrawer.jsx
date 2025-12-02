import React, { useEffect, useState } from "react";
import {
  Drawer, Box, Typography, IconButton, Tabs, Tab, CircularProgress,
  Grid, Card, CardContent, Chip, List, ListItem, ListItemText, ListItemIcon,
  Avatar, Stack, Alert, Tooltip, Divider
} from "@mui/material";
import {
  Close, Person, Medication, History, PhoneAndroid,
  Email, VpnKey, AccessTime, Science, LocalPharmacy,
  CalendarMonth, Login, Diamond, Snooze, TrendingUp,
  NotificationsActive, CheckCircle, Cancel, HelpOutline,
  Update, Android, Apple, QuestionMark
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

import {
  fetchUserDetails,
  fetchUserMedicationLogs,
  fetchUserMedicines,
  fetchReminderLogs
} from "../services/api"; 

// --- GÜÇLENDİRİLMİŞ TARİH FORMATLAYICI ---
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

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ height: '100%' }}>
      {value === index && <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>{children}</Box>}
    </div>
  );
}

export default function UserDetailDrawer({ open, onClose, selectedUser }) {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [details, setDetails] = useState(null);
  const [meds, setMeds] = useState([]); 
  const [logs, setLogs] = useState([]); 
  const [reminderLogs, setReminderLogs] = useState([]);

  const targetUid = selectedUser?.uid || selectedUser?.id;

  useEffect(() => {
    if (open && targetUid) {
      loadUserData(targetUid);
    }
  }, [open, targetUid]);

  const loadUserData = async (uid) => {
    setLoading(true);
    // Eski verileri temizle
    setDetails(null); setMeds([]); setLogs([]); setReminderLogs([]);

    try {
      const [userRes, medsRes, logsRes, remindersRes] = await Promise.all([
        fetchUserDetails(uid).catch(() => null),
        fetchUserMedicines(uid).catch(() => []),
        fetchUserMedicationLogs(uid).catch(() => []), 
        fetchReminderLogs(uid).catch(() => [])         
      ]);

      setDetails(userRes || selectedUser); 
      setMeds(Array.isArray(medsRes) ? medsRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
      setReminderLogs(Array.isArray(remindersRes) ? remindersRes : []);

    } catch (error) {
      console.error("Veri Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // --- TABLO: HATIRLATMA ANALİZİ ---
  const reminderColumns = [
    { field: 'createdAt', headerName: 'İşlem Zamanı', width: 150, valueFormatter: (params) => formatDate(params.value) },
    { field: 'medicineName', headerName: 'İlaç', width: 140, valueGetter: (params) => params.row.medicineName || params.row.medName || '-' },
    { 
        field: 'eventType', headerName: 'Olay', width: 190,
        renderCell: (params) => {
            const type = params.value || "UNKNOWN";
            // Ham verileri okunabilir hale getiriyoruz
            if(type.includes("SNOOZE")) return <Chip icon={<Snooze/>} label="Ertelendi" color="warning" size="small" variant="outlined"/>;
            if(type.includes("ESCALATION")) return <Chip icon={<TrendingUp/>} label="Eskalasyon" color="error" size="small" variant="outlined"/>;
            if(type.includes("ALARM") || type === "REMINDER_TRIGGERED") return <Chip icon={<NotificationsActive/>} label="Alarm Çaldı" color="info" size="small" variant="outlined"/>;
            if(type === "NOTIFICATION_SENT") return <Chip icon={<CheckCircle/>} label="Bildirim Gitti" color="success" size="small" variant="outlined"/>;
            if(type === "REMINDER_UPDATED") return <Chip icon={<Update/>} label="Saat Güncellendi" size="small" variant="outlined"/>;
            if(type === "TAKEN") return <Chip icon={<CheckCircle/>} label="Alındı" color="success" size="small"/>;
            if(type === "MISSED") return <Chip icon={<Cancel/>} label="Kaçırıldı" color="error" size="small"/>;
            
            return <Chip label={type} size="small" />;
        }
    },
    { 
        field: 'description', headerName: 'Teknik Detay', width: 250, flex: 1,
        valueGetter: (params) => {
            // "Teknik Detay" için olası tüm alanları kontrol et
            return params.row.description 
                || params.row.details 
                || params.row.error 
                || params.row.reason 
                || (params.row.payload ? JSON.stringify(params.row.payload) : '-')
        }
    }
  ];

  // --- TABLO: İLAÇ GEÇMİŞİ ---
  const historyColumns = [
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
  ];

  const displayUser = details || selectedUser || {};

  // --- CİHAZ MODELİ BULUCU (Ajan Modu) ---
  const getDeviceName = () => {
    const u = displayUser;
    // Tüm olası alanları kontrol ediyoruz
    if (u.deviceModel) return u.deviceModel;
    if (u.model) return u.model; // Bazı sistemler direkt 'model' kaydeder
    if (u.productName) return u.productName;
    if (u.brand && u.product) return `${u.brand} ${u.product}`.toUpperCase();
    if (u.manufacturer && u.device) return `${u.manufacturer} ${u.device}`.toUpperCase();
    
    // Eğer hiçbiri yoksa ve sadece ID varsa
    if (u.deviceId) return `Bilinmeyen Cihaz (ID: ${u.deviceId.substring(0, 6)}...)`;
    
    return "Cihaz Bilgisi Yok";
  };

  const getOSInfo = () => {
      if (displayUser.osVersion) return `Android ${displayUser.osVersion}`;
      if (displayUser.platform) return displayUser.platform; // 'iOS' veya 'Android'
      return "Bilinmiyor";
  };

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
                            icon={displayUser.isPremium ? <Diamond fontSize="small"/> : null}
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
            <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover' }}>
              <Close />
            </IconButton>
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
                        <Typography variant="body2" fontWeight="600">{formatDate(displayUser.premiumStartDate)}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1.5, bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }} display="block">Premium Bitiş</Typography>
                        <Typography variant="body2" fontWeight="600">{formatDate(displayUser.premiumEndDate)}</Typography>
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

                {/* 2. İLAÇLAR */}
                <CustomTabPanel value={tabIndex} index={1}>
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

                {/* 3. HATIRLATMA ANALİZİ */}
                <CustomTabPanel value={tabIndex} index={2}>
                     <Alert severity="info" sx={{ mb: 2 }}>
                        Sistemin gönderdiği bildirimler ve kullanıcının teknik tepkileri (Alarm, Erteleme, Bildirim İletimi).
                     </Alert>
                     <Card sx={{ height: 600, borderRadius: 2 }}>
                        <DataGrid
                            rows={reminderLogs.map((l, i) => ({ id: l.id || i, ...l }))}
                            columns={reminderColumns}
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

                {/* 4. İÇİM GEÇMİŞİ */}
                <CustomTabPanel value={tabIndex} index={3}>
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
    </Drawer>
  );
}