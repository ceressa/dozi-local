import React, { useEffect, useState } from "react";
// API fonksiyonunu kendi path'ine göre import et
// Örn: export const fetchDashboardAnalytics = () => axios.get('/analytics/dashboard').then(res => res.data);
import { fetchDashboardAnalytics } from "../services/api";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  Alert
} from "@mui/material";
import {
  Medication,
  NotificationsActive,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  Download,
  FilterList,
  DateRange,
  Warning
} from "@mui/icons-material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// --- KART BİLEŞENİ (Değişmedi, aynı kalabilir) ---
const AnalyticsCard = ({ title, value, icon, subtitle, color, trend, loading, index }) => {
  const theme = useTheme();
  if (loading) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: "100%",
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
            : `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
          border: "1px solid",
          borderColor: `${color}30`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: 3,
                background: `${color}20`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 28, color } })}
            </Box>
            {trend !== undefined && (
              <Chip
                size="small"
                icon={<TrendingUp sx={{ fontSize: 14 }} />}
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                sx={{
                  backgroundColor: trend >= 0 ? "success.light" : "error.light",
                  color: trend >= 0 ? "success.dark" : "error.dark",
                  fontWeight: 600
                }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>{title}</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>
            <CountUp end={value} duration={2} separator="," />
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>{subtitle}</Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AnalyticsPage() {
  const theme = useTheme();
  const [data, setData] = useState(null); // Backend'den gelen tüm obje
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await fetchDashboardAnalytics(); // Backend'e istek
            setData(response);
        } catch (err) {
            console.error(err);
            setError("Veriler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };
    loadStats();
  }, [timeRange]);

  // Backend verisi gelmediyse güvenli defaultlar
  const stats = data?.summary || {};
  const charts = data?.charts || { dailyHistory: [], statusDistribution: [], hourlyActivity: [], timeOfDayAdherence: [] };

  const cards = [
    {
      title: "Toplam Kayıt",
      value: stats.totalMedicationLogs || 0,
      icon: <Medication />,
      subtitle: "Tüm zamanlar",
      color: "#6366F1",
      trend: 12 // Bu trend'i de backend'den hesaplayıp yollayabilirsin
    },
    {
      title: "Alınan İlaçlar",
      value: stats.taken || 0,
      icon: <CheckCircle />,
      subtitle: "Başarıyla alındı",
      color: "#10B981",
      trend: 8
    },
    {
      title: "Atlanan/Pas Geçilen",
      value: stats.skipped || 0,
      icon: <Cancel />,
      subtitle: "Kullanıcı atladı",
      color: "#F59E0B",
      trend: -2
    },
    {
      title: "Kaçırılan (Missed)",
      value: stats.missed || 0,
      icon: <Warning />,
      subtitle: "Yanıt verilmedi",
      color: "#EF4444",
      trend: 0
    },
    {
      title: "Bildirimler",
      value: stats.notificationSent || 0,
      icon: <NotificationsActive />,
      subtitle: "Gönderilen",
      color: "#EC4899",
      trend: 15
    },
    {
      title: "Okunma Oranı",
      value: stats.notificationSent ? Math.round((stats.notificationRead / stats.notificationSent) * 100) : 0,
      icon: <Schedule />,
      subtitle: "% Oran",
      color: "#8B5CF6",
      trend: 5
    }
  ];

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistem genelindeki ilaç kullanım ve bildirim istatistikleri (Son 7 Gün)
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Zaman</InputLabel>
              <Select value={timeRange} label="Zaman" onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="week">Bu Hafta</MenuItem>
                <MenuItem value="month">Bu Ay</MenuItem>
              </Select>
            </FormControl>
            <IconButton><Download /></IconButton>
          </Box>
        </Box>
      </motion.div>

      {/* KPI KARTLARI */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
            <AnalyticsCard {...card} loading={loading} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* GRAFİKLER BÖLÜMÜ */}
      <Grid container spacing={3}>
        
        {/* 1. GÜNLÜK TREND (AREA CHART) */}
        <Grid item xs={12} lg={8}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ borderRadius: 4, boxShadow: theme.shadows[3] }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">Haftalık İlaç Uyumu</Typography>
                  <Chip icon={<DateRange />} label="Son 7 Gün" size="small" />
                </Box>
                <Box sx={{ height: 350 }}>
                  {loading ? <Skeleton variant="rectangular" height="100%" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.dailyHistory}>
                        <defs>
                          <linearGradient id="colorTaken" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorSkipped" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="taken" name="Alınan" stackId="1" stroke="#10B981" fill="url(#colorTaken)" />
                        <Area type="monotone" dataKey="skipped" name="Atlanan" stackId="1" stroke="#F59E0B" fill="url(#colorSkipped)" />
                        <Area type="monotone" dataKey="missed" name="Kaçırılan" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 2. GENEL DAĞILIM (PIE CHART) */}
        <Grid item xs={12} lg={4}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ height: "100%", borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={3}>Genel Durum Dağılımı</Typography>
                <Box sx={{ height: 350 }}>
                   {loading ? <Skeleton variant="rectangular" height="100%" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={charts.statusDistribution}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {charts.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                   )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 3. ZAMAN DİLİMİ (RADAR CHART) */}
        <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Günün Hangi Vakti Daha Başarılı?</Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={charts.timeOfDayAdherence}>
                                <PolarGrid stroke={theme.palette.divider} />
                                <PolarAngleAxis dataKey="category" stroke={theme.palette.text.secondary} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar name="Alınan İlaçlar" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>
        </Grid>

        {/* 4. SAATLİK AKTİVİTE (BAR CHART) */}
        <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Saatlik İlaç Alım Yoğunluğu</Typography>
                    <Box sx={{ height: 300 }}>
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.hourlyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" hide />
                                <YAxis />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" name="İşlem Sayısı" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>
        </Grid>

      </Grid>
    </Box>
  );
}