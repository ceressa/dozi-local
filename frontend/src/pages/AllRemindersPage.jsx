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

        // --- 2. AKILLI ANALİZ (DEDEKTİF MODU) ---
        // Sadece trigger'ları bulup session oluşturuyoruz
        const triggers = logs.filter(l => 
            l.eventType === "ALARM_TRIGGERED" || 
            l.eventType === "NOTIFICATION_SENT"
        );

        // Çift kayıtları temizle
        const processedKeys = new Set();
        // Ham veriyi işlemeden önce sıralayalım
        triggers.sort((a, b) => b.timestamp - a.timestamp); 

        triggers.forEach(trigger => {
            const dateObj = new Date(Number(trigger.timestamp));
            // Key: YYYY-MM-DD HH:MM
            const timeKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()} ${dateObj.getHours()}:${dateObj.getMinutes()}`;

            if (!processedKeys.has(timeKey)) {
                processedKeys.add(timeKey);

                // İlgili ilacı bul (Silinmişse ismini logdan al)
                const medName = meds.find(m => m.id === trigger.medicineId)?.name || trigger.medicineName || "Silinmiş İlaç";

                // --- 2 SAATLİK PENCERE ANALİZİ ---
                const start = trigger.timestamp - 60000; // -1 dk
                const end = trigger.timestamp + (2 * 60 * 60 * 1000); // +2 saat

                // Sadece bu ilaca ve bu zamana ait loglar
                const relatedLogs = logs.filter(l => 
                    l.medicineId === trigger.medicineId && 
                    l.timestamp >= start && 
                    l.timestamp <= end
                );

                const alarmLog = relatedLogs.find(l => l.eventType === "ALARM_TRIGGERED");
                const notifLog = relatedLogs.find(l => l.eventType === "NOTIFICATION_SENT");
                const takenLog = relatedLogs.find(l => l.eventType.includes("TAKEN"));
                const missedLog = relatedLogs.find(l => l.eventType.includes("MISSED"));
                
                // --- GÜVEN SKORU ---
                let deliveryStatus = "UNKNOWN";
                let notificationId = notifLog?.metadata?.notificationId || trigger.metadata?.notificationId;

                if (notificationId) {
                    if (alarmLog) deliveryStatus = "DELIVERED_OS"; 
                    else deliveryStatus = "DELIVERED_UNK_WAKE";
                } else if (alarmLog && !notifLog) {
                    deliveryStatus = "FAILED_APP";
                }

                // --- SONUÇ ---
                let finalResult = "Bekleniyor...";
                let resultColor = "default";

                if (takenLog) {
                    finalResult = "✅ İlaç Alındı";
                    resultColor = "success";
                } else if (missedLog) {
                    if (deliveryStatus === "DELIVERED_OS") {
                        finalResult = "⛔ Kullanıcı Yanıt Vermedi";
                        resultColor = "warning";
                    } else if (deliveryStatus === "FAILED_APP") {
                        finalResult = "❌ Gönderilemediği için Kaçtı";
                        resultColor = "error";
                    } else {
                         finalResult = "❓ Yanıtsız";
                    }
                }

                sessions.push({
                    id: trigger.id,
                    timestamp: Number(trigger.timestamp), // SAYI OLARAK SAKLA
                    userName: user.name,
                    medicineName: medName,
                    deviceInfo: `${trigger.deviceModel || '-'}`,
                    deliveryStatus,
                    notificationId,
                    result: finalResult,
                    resultColor
                });
            }
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
        field: "timestamp", 
        headerName: "Planlanan Tarih", 
        width: 160, 
        type: 'number',
        valueFormatter: (params) => formatDate(params.value) 
    },
    { field: "userName", headerName: "Kullanıcı", width: 130 },
    { field: "medicineName", headerName: "İlaç", width: 140 },
    {
        field: "deliveryStatus",
        headerName: "İletim Analizi (Teknik)",
        width: 280,
        renderCell: (params) => {
            const { deliveryStatus, notificationId } = params.row;
            if (deliveryStatus === "DELIVERED_OS") {
                return (
                    <Tooltip title={`Android ID: ${notificationId}`}>
                        <Chip icon={<WifiTethering />} label="Cihaza Ulaştı" color="success" variant="outlined" size="small" />
                    </Tooltip>
                );
            } else if (deliveryStatus === "FAILED_APP") {
                 return <Chip icon={<ErrorIcon />} label="HATA: Oluşturulamadı" color="error" size="small" />;
            } 
            return <Chip label="Belirsiz" size="small" />;
        }
    },
    {
        field: "result",
        headerName: "Sonuç",
        width: 220,
        renderCell: (params) => (
            <Chip 
                label={params.row.result} 
                color={params.row.resultColor}
                size="small"
                icon={params.row.result.includes("Yanıt") ? <DoNotDisturbOn /> : params.row.result.includes("Alındı") ? <CheckCircle /> : <Info />}
            />
        )
    },
    { field: "deviceInfo", headerName: "Cihaz", width: 150 },
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
                 <Box sx={{ height: 750 }}>
                    <DataGrid
                        rows={analysisRows}
                        columns={analysisColumns}
                        slots={{ toolbar: CustomToolbar }}
                        loading={loading}
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

    </Box>
  );
}