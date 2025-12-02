import React, { useEffect, useState, useCallback, useMemo } from "react";
// DÜZELTME 1: fetchUsers eklendi
import { fetchDashboardAnalytics, fetchUsers } from "../services/api";
import CountUp from "react-countup";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Avatar,
  Chip,
  Paper,
  IconButton,
  useTheme,
  Alert,
  Skeleton,
  Button,
  Menu,
  MenuItem,
  Stack,
  Tooltip as MuiTooltip,
  Fade
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  People,
  Medication,
  NotificationsActive,
  MoreVert,
  Star,
  DateRange,
  Refresh,
  Download,
  CalendarToday,
  ErrorOutline
} from "@mui/icons-material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Skeleton Loading Component
const StatCardSkeleton = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={40} sx={{ my: 1 }} />
            <Skeleton variant="text" width="50%" height={16} />
          </Box>
          <Skeleton variant="rounded" width={48} height={48} />
        </Box>
      </CardContent>
    </Card>
  );
};

const StatCard = React.memo(({ title, value, icon, change, color, index }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        sx={{
          height: '100%',
          position: "relative",
          overflow: "visible",
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`
            : "linear-gradient(135deg, #fff 0%, #f8fafc 100%)",
          border: "1px solid",
          borderColor: `${color}30`,
          "&:hover": {
            transform: "translateY(-4px)",
            transition: "all 0.3s ease",
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                <CountUp end={value} duration={2} separator="," />
              </Typography>
              {/* Change (Trend) alanı opsiyonel yapıldı */}
              {change !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {change > 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: change > 0 ? "success.main" : "error.main",
                      fontWeight: 600
                    }}
                  >
                    {Math.abs(change)}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, ml: 0.5 }}>
                    vs last month
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default function DashboardPage() {
  const theme = useTheme();
  const [data, setData] = useState(null); // stats yerine data ismini kullandım (root obje)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dateRange, setDateRange] = useState("7d"); // 7d, 30d, 90d
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [analyticsData, usersData] = await Promise.all([
        fetchDashboardAnalytics(),
        fetchUsers()
      ]);
      setData(analyticsData);
      setUsers(usersData.slice(0, 5)); // Son 5 kullanıcı
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        handleRefresh(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  // Manual refresh handler
  const handleRefresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!data || !users) return;

    const summary = data?.summary || {};
    const csvContent = `Dashboard Export - ${new Date().toLocaleDateString()}\n\n` +
      `Total Users,${users.length}\n` +
      `Total Medication Logs,${summary.totalMedicationLogs || 0}\n` +
      `Notifications Sent,${summary.notificationSent || 0}\n` +
      `Taken,${summary.taken || 0}\n` +
      `Skipped,${summary.skipped || 0}\n` +
      `Missed,${summary.missed || 0}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [data, users]);

  // Date range menu handlers
  const handleDateRangeClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDateRangeClose = () => {
    setAnchorEl(null);
  };

  const handleDateRangeSelect = (range) => {
    setDateRange(range);
    setAnchorEl(null);
    // In a real app, you'd refetch data with the new date range
  };

  // Loading state with skeletons
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width={250} height={48} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={180} height={32} />
                <Skeleton variant="circular" width={180} height={180} sx={{ mx: "auto", mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            severity="error"
            icon={<ErrorOutline />}
            action={
              <Button color="inherit" size="small" onClick={() => handleRefresh()}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Failed to load dashboard
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </motion.div>
      </Box>
    );
  }

  // DÜZELTME 2: Veri parçalama (Destructuring)
  // Backend yapısı: { summary: {...}, charts: {...} }
  const summary = data?.summary || {};
  const charts = data?.charts || {};

  // KPI Kartları (Veriler artık summary içinden okunuyor) - Memoized
  const statCards = useMemo(() => [
    {
      title: "Total Users",
      value: users.length * 1, // Gerçek kullanıcı sayısı
      icon: <People />,
      change: 12, // Bu backendden gelmediği için dummy kaldı
      color: "#6366F1"
    },
    {
      title: "Total Logs",
      value: summary.totalMedicationLogs || 0,
      icon: <Medication />,
      change: 8,
      color: "#10B981"
    },
    {
      title: "Notifications Sent",
      value: summary.notificationSent || 0,
      icon: <NotificationsActive />,
      change: 15, // Pozitif yaptım çünkü bildirim artışı iyidir
      color: "#F59E0B"
    },
    {
      title: "Premium Users",
      value: users.filter(u => u.isPremium).length,
      icon: <Star />,
      change: 5,
      color: "#EC4899"
    }
  ], [users, summary]);

  // Başarı Oranı Hesaplama - Memoized
  const complianceRate = useMemo(() => {
    return summary.taken && summary.totalMedicationLogs
      ? Math.round((summary.taken / summary.totalMedicationLogs) * 100)
      : 0;
  }, [summary]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    switch(dateRange) {
      case "7d": return "Last 7 Days";
      case "30d": return "Last 30 Days";
      case "90d": return "Last 90 Days";
      default: return "Last 7 Days";
    }
  }, [dateRange]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome back, Ufuk! 👋
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </motion.div>

        <Stack direction="row" spacing={1}>
          <MuiTooltip title="Refresh data">
            <IconButton
              onClick={() => handleRefresh()}
              disabled={refreshing}
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <Refresh sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </MuiTooltip>

          <MuiTooltip title="Date range">
            <Button
              variant="outlined"
              startIcon={<CalendarToday />}
              onClick={handleDateRangeClick}
              size="small"
            >
              {dateRangeLabel}
            </Button>
          </MuiTooltip>

          <MuiTooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              size="small"
            >
              Export
            </Button>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Date Range Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDateRangeClose}
      >
        <MenuItem onClick={() => handleDateRangeSelect("7d")}>
          Last 7 Days
        </MenuItem>
        <MenuItem onClick={() => handleDateRangeSelect("30d")}>
          Last 30 Days
        </MenuItem>
        <MenuItem onClick={() => handleDateRangeSelect("90d")}>
          Last 90 Days
        </MenuItem>
      </Menu>

      {/* KPI KARTLARI */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <StatCard {...card} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* GRAFİKLER */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* 1. GÜNLÜK AKTİVİTE (Area Chart) */}
        {/* DÜZELTME 3: Backend'den gelen 'charts.dailyHistory' kullanıldı */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Last 7 Days Activity
                  </Typography>
                  <Chip icon={<DateRange />} label="Weekly" size="small" />
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={charts.dailyHistory || []}>
                    <defs>
                      <linearGradient id="colorTaken" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSkipped" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="taken" name="Taken" stroke="#10B981" fill="url(#colorTaken)" strokeWidth={2} />
                    <Area type="monotone" dataKey="skipped" name="Skipped" stroke="#F59E0B" fill="url(#colorSkipped)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 2. UYUM ORANI (Circular Progress + List) */}
        {/* DÜZELTME 4: Veriler 'charts.statusDistribution'dan çekiliyor */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Medication Compliance
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                  <Box sx={{ width: 180, height: 180 }}>
                    <CircularProgressbar
                      value={complianceRate}
                      text={`${complianceRate}%`}
                      styles={buildStyles({
                        textSize: "16px",
                        pathColor: theme.palette.primary.main,
                        textColor: theme.palette.text.primary,
                        trailColor: theme.palette.action.hover
                      })}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  {charts.statusDistribution?.map((item) => (
                    <Box key={item.name} sx={{ textAlign: "center" }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: item.color,
                          mx: "auto",
                          mb: 0.5
                        }}
                      />
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* ALT SATIR: Saatlik Dağılım & Kullanıcılar */}
      <Grid container spacing={3}>
        {/* 3. SAATLİK AKTİVİTE (Bar Chart) */}
        {/* DÜZELTME 5: 'charts.hourlyActivity' bağlandı */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Hourly Activity (Taken)
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={charts.hourlyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 8
                      }}
                    />
                    <Bar dataKey="value" name="Logs" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* 4. SON KULLANICILAR */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Users
                  </Typography>
                  <Chip
                    label="View All"
                    size="small"
                    clickable
                    onClick={() => window.dispatchEvent(new CustomEvent('navigateToUsers'))}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {users.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        No users yet
                      </Typography>
                    </Box>
                  ) : (
                    users.map((user) => (
                      <motion.div
                        key={user.uid}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: theme.palette.divider,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                              borderColor: theme.palette.primary.main,
                              boxShadow: theme.shadows[2]
                            }
                          }}
                          onClick={() => {
                            // In a real app, navigate to user details
                            console.log("Navigate to user:", user.uid);
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar
                              sx={{
                                background: theme.palette.background.gradient,
                                width: 44,
                                height: 44
                              }}
                            >
                              {user.name?.charAt(0) || "U"}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {user.name || "Unknown User"}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            {user.isPremium && (
                              <Chip
                                label="Premium"
                                size="small"
                                color="primary"
                                variant="outlined"
                                icon={<Star sx={{ fontSize: 14 }} />}
                              />
                            )}
                            {user.isBanned && (
                              <Chip label="Banned" size="small" color="error" variant="filled" />
                            )}
                          </Box>
                        </Paper>
                      </motion.div>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Refresh notification */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: theme.palette.background.paper
              }}
            >
              <Refresh
                sx={{
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              <Typography variant="body2">Refreshing dashboard...</Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}