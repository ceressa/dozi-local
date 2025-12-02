import { useEffect, useState } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  Tooltip
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  NotificationsActive,
  DoNotDisturbOn,
  WifiTethering,
  ListAlt,
  FactCheck,
  Info
} from "@mui/icons-material";
import { fetchAllReminders } from "../services/api";

// --- YARDIMCI FORMATERLAR ---
const formatTime = (timestamp) => {
  if (!timestamp) return "-";
  const d = new Date(Number(timestamp));
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp)).toLocaleDateString("tr-TR") + " " + formatTime(timestamp);
};

// Firestore timestamp'i Date'e çevir
const parseFirestoreDate = (val) => {
  if (!val) return null;

  if (typeof val === 'object' && val !== null && val._seconds) {
    return new Date(val._seconds * 1000);
  } else if (typeof val === 'number') {
    return new Date(val);
  } else if (typeof val === 'string') {
    return new Date(val);
  }

  return null;
};

// Saat karşılaştırma (±threshold dakika)
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

// Toolbar
function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1 }}>
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

export default function AdvancedRemindersPage() {
  const [rows, setRows] = useState([]); 
  const [analysisRows, setAnalysisRows] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // Varsayılan: Ham Loglar

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllReminders();
      
      const tempLogs = [];
      const sessions = [];

      data.forEach((userBlock) => {
        const user = userBlock.user || {};
        const meds = userBlock.medicines || [];
        const logs = userBlock.reminderLogs || [];

        // --- DÜZELTME: Önce Logları Dönüyoruz (Silinen ilaçları kaçırmamak için) ---
        logs.forEach((log) => {
             // İlacı ID ile bulmaya çalış, bulamazsan silinmiştir
             const med = meds.find(m => m.id === log.medicineId);
             
             // 1. HAM LOG LİSTESİ İÇİN VERİ
             tempLogs.push({
                id: log.id,
                userName: user.name || "Bilinmiyor",
                userId: userBlock.userId,
                // İlaç silindiyse bile logu gösterelim
                medicineName: med ? med.name : `Silinmiş İlaç (${log.medicineName || '?'})`,
                eventType: log.eventType,
                eventDescription: log.eventDescription,
                success: log.success,
                timestamp: Number(log.timestamp), // SAYI OLARAK SAKLA (Sıralama için şart)
                deviceModel: log.deviceModel || "-",
                notificationId: log.metadata?.notificationId
             });
        });

        // --- 2. SCHEDULE-BASED ANALİZ ---
        // Her ilaç için schedule-based analiz yap
        meds.forEach(med => {
          if (!med.times || med.times.length === 0) return;

          // Her hatırlatma saati için
          med.times.forEach(time => {
            // Bu ilacın bu saatine ait logları bul
            const relevantLogs = logs.filter(log => {
              const logMedId = log.medicineId || log.medId;
              if (logMedId !== med.id) return false;

              // Saat bilgisi varsa kontrol et
              if (log.scheduledTime || log.reminderTime) {
                const logTime = log.scheduledTime || log.reminderTime;
                if (logTime === time) return true;
              }

              // Saat bilgisi yoksa, log zamanına bak (±15 dakika)
              const logDate = parseFirestoreDate(log.createdAt || log.timestamp);
              if (logDate && !isNaN(logDate.getTime())) {
                const logHour = String(logDate.getHours()).padStart(2, '0');
                const logMinute = String(logDate.getMinutes()).padStart(2, '0');
                const logTimeStr = `${logHour}:${logMinute}`;

                if (isTimeClose(time, logTimeStr, 15)) return true;
              }

              return false;
            });

            // Log'ları tarihe göre grupla
            const logsByDate = {};
            relevantLogs.forEach(log => {
              const logDate = parseFirestoreDate(log.createdAt || log.timestamp);
              if (!logDate || isNaN(logDate.getTime())) return;

              const dateKey = logDate.toISOString().split('T')[0]; // YYYY-MM-DD

              if (!logsByDate[dateKey]) {
                logsByDate[dateKey] = [];
              }
              logsByDate[dateKey].push(log);
            });

            // Her gün için analiz (Son 30 gün)
            Object.keys(logsByDate).sort().reverse().slice(0, 30).forEach(dateKey => {
              const dayLogs = logsByDate[dateKey];

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
                } else {
                  notificationStatus = 'sent';
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
              let actionLabel = 'Aksiyon Yok';
              let actionColor = 'default';

              if (userAction) {
                const type = (userAction.eventType || userAction.type || '').toUpperCase();
                if (type === 'TAKEN' || type.includes('MEDICATION_TAKEN')) {
                  action = 'taken';
                  actionLabel = '✅ İlaç Alındı';
                  actionColor = 'success';
                } else if (type === 'MISSED' || type.includes('MEDICATION_MISSED')) {
                  action = 'missed';
                  actionLabel = '❌ Kaçırıldı';
                  actionColor = 'error';
                } else if (type === 'SKIPPED' || type.includes('MEDICATION_SKIPPED')) {
                  action = 'skipped';
                  actionLabel = '⚠️ Atladı';
                  actionColor = 'warning';
                } else if (type.includes('SNOOZE')) {
                  action = 'snoozed';
                  actionLabel = '⏰ Erteledi';
                  actionColor = 'info';
                }
              }

              // Notification ID
              const notificationId = notificationLog?.metadata?.notificationId || dayLogs.find(l => l.metadata?.notificationId)?.metadata?.notificationId;

              sessions.push({
                id: `${user.uid || userBlock.userId}-${dateKey}-${time}-${med.id}`,
                timestamp: new Date(dateKey + 'T' + time + ':00').getTime(),
                date: dateKey,
                time: time,
                userName: user.name || 'Bilinmiyor',
                userId: userBlock.userId,
                medicineName: med.name,
                notificationStatus,
                notificationError,
                action,
                actionLabel,
                actionColor,
                notificationId,
                logCount: dayLogs.length
              });
            });
          });
        });
      });

      setRows(tempLogs);
      setAnalysisRows(sessions);

    } catch (error) {
      console.error("Veri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- KOLONLAR: HAM LOGLAR ---
  const logColumns = [
    { 
        field: "timestamp", 
        headerName: "Tarih & Saat", 
        width: 180, 
        type: 'number', // Sıralama için sayısal tip
        valueFormatter: (params) => formatDate(params.value) // Gösterim için formatla
    },
    { field: "medicineName", headerName: "İlaç", width: 180 },
    { 
        field: "eventType", 
        headerName: "Olay Tipi", 
        width: 220,
        renderCell: (params) => {
            let color = "default";
            if(params.value.includes("ERROR") || params.row.success === false) color = "error";
            else if(params.value.includes("SENT")) color = "success";
            else if(params.value.includes("MISSED")) color = "warning";
            else if(params.value.includes("TAKEN")) color = "success";
            
            return <Chip label={params.value} color={color} size="small" variant="outlined" />
        }
    },
    { field: "eventDescription", headerName: "Detay", width: 400 },
    { field: "userName", headerName: "Kullanıcı", width: 150 },
  ];

  // --- KOLONLAR: ANALİZ ---
  const analysisColumns = [
    {
        field: "date",
        headerName: "Tarih",
        width: 120,
        valueFormatter: (params) => {
          const date = new Date(params.value);
          return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    },
    {
        field: "time",
        headerName: "Saat",
        width: 80
    },
    { field: "userName", headerName: "Kullanıcı", width: 140 },
    { field: "medicineName", headerName: "İlaç", width: 150 },
    {
        field: "notificationStatus",
        headerName: "Bildirim Durumu",
        width: 200,
        renderCell: (params) => {
            const status = params.value;

            if (status === 'sent') {
              return <Chip icon={<CheckCircle />} label="✓ Gönderildi" color="success" size="small" sx={{ fontWeight: 600 }} />;
            } else if (status === 'failed') {
              return <Chip icon={<ErrorIcon />} label="✗ Gönderilemedi" color="error" size="small" sx={{ fontWeight: 600 }} />;
            } else {
              return <Chip icon={<Warning />} label="? Bildirim Yok" color="default" size="small" />;
            }
        }
    },
    {
        field: "actionLabel",
        headerName: "Kullanıcı Aksiyonu",
        width: 180,
        renderCell: (params) => (
            <Chip
                label={params.value}
                color={params.row.actionColor}
                size="small"
                variant={params.row.action === 'taken' ? 'filled' : 'outlined'}
            />
        )
    },
    {
        field: "notificationError",
        headerName: "Hata/Detay",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => {
            const error = params.value;
            const logCount = params.row.logCount || 0;

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

            return (
              <Typography variant="caption" color="text.secondary">
                {logCount} olay kaydı
              </Typography>
            );
        }
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 800 }}>
        🔍 Detektif: Bildirim Analizi
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
            <Tab icon={<ListAlt />} label={`Ham Kayıtlar (${rows.length})`} iconPosition="start" />
            <Tab icon={<FactCheck />} label={`Akıllı Analiz (${analysisRows.length})`} iconPosition="start" />
        </Tabs>
      </Box>

      {/* SEKME 1: HAM LOGLAR */}
      {tabIndex === 0 && (
         <Card sx={{ borderRadius: 2 }}>
            <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Burada veritabanındaki tüm ham kayıtlar listelenir. Silinmiş ilaçlara ait loglar da buradadır.
                </Alert>
                <Box sx={{ height: 750 }}>
                    <DataGrid 
                        rows={rows} 
                        columns={logColumns} 
                        slots={{ toolbar: CustomToolbar }}
                        loading={loading}
                        // SIRALAMA AYARI: En yeni tarih en üstte
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'timestamp', sort: 'desc' }],
                            },
                            pagination: { paginationModel: { pageSize: 50 } },
                        }}
                    />
                </Box>
            </CardContent>
         </Card>
      )}

      {/* SEKME 2: ANALİZ */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: 2 }}>
             <CardContent>
                 <Alert severity="info" sx={{ mb: 2 }} icon={<NotificationsActive />}>
                    <strong>Schedule-Based Analiz:</strong> Her satır bir ilacın planlanmış hatırlatma saatini gösterir.
                    Bildirim gönderildi mi? Kullanıcı ne yaptı? Hata var mı? Tüm detaylar burada.
                 </Alert>
                 <Box sx={{ height: 750 }}>
                    <DataGrid
                        rows={analysisRows}
                        columns={analysisColumns}
                        slots={{ toolbar: CustomToolbar }}
                        loading={loading}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'date', sort: 'desc' }],
                            },
                            pagination: { paginationModel: { pageSize: 50 } },
                        }}
                    />
                </Box>
             </CardContent>
        </Card>
      )}

    </Box>
  );
}