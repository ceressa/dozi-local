import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
  Area,
  AreaChart
} from "recharts";
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  useTheme
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  Schedule,
  EmojiEvents
} from "@mui/icons-material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        background: theme.palette.mode === "dark"
          ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
          : `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border: "1px solid",
        borderColor: theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : `${color}20`
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default function UserStatsCharts({ stats }) {
  const theme = useTheme();

  if (!stats) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          No statistics available for this user
        </Typography>
      </Paper>
    );
  }

  const summaryData = [
    {
      name: "Taken",
      value: stats.totalMedicationsTaken || stats.totalDosesTaken || 0,
      color: "#10B981"
    },
    {
      name: "Missed",
      value: stats.totalMedicationsMissed || 0,
      color: "#EF4444"
    },
    {
      name: "Skipped",
      value: stats.totalMedicationsSkipped || 0,
      color: "#F59E0B"
    }
  ];

  const streakData = [
    {
      name: "Current Streak",
      value: stats.currentStreak || 0,
      fill: theme.palette.primary.main
    },
    {
      name: "Longest Streak",
      value: stats.longestStreak || 0,
      fill: theme.palette.secondary.main
    }
  ];

  const complianceRate = stats.complianceRate || 0;
  const compliancePercentage = Math.round(complianceRate * 100);

  // Weekly compliance trend (sample data)
  const weeklyData = [
    { day: "Mon", compliance: 85 },
    { day: "Tue", compliance: 92 },
    { day: "Wed", compliance: 78 },
    { day: "Thu", compliance: 88 },
    { day: "Fri", compliance: 90 },
    { day: "Sat", compliance: 75 },
    { day: "Sun", compliance: 82 }
  ];

  // Time distribution (sample data)
  const timeDistribution = [
    { time: "Morning", doses: 45, percentage: 40 },
    { time: "Afternoon", doses: 30, percentage: 27 },
    { time: "Evening", doses: 25, percentage: 22 },
    { time: "Night", doses: 12, percentage: 11 }
  ];

  const COLORS = {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak || 0} days`}
            subtitle="Consecutive days"
            icon={<EmojiEvents sx={{ color: COLORS.warning }} />}
            color={COLORS.warning}
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Longest Streak"
            value={`${stats.longestStreak || 0} days`}
            subtitle="Personal best"
            icon={<TrendingUp sx={{ color: COLORS.success }} />}
            color={COLORS.success}
          />
        </Grid>
      </Grid>

      {/* Compliance Rate Circle */}
      <Paper sx={{ p: 3, mb: 3, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Overall Compliance Rate
        </Typography>
        <Box sx={{ width: 180, height: 180, mx: "auto", mb: 2 }}>
          <CircularProgressbar
            value={compliancePercentage}
            text={`${compliancePercentage}%`}
            styles={buildStyles({
              pathColor: compliancePercentage >= 80 ? COLORS.success : 
                         compliancePercentage >= 50 ? COLORS.warning : COLORS.error,
              textColor: theme.palette.text.primary,
              trailColor: theme.palette.action.hover,
              textSize: "20px"
            })}
          />
        </Box>
        <Chip
          label={
            compliancePercentage >= 80 ? "Excellent" :
            compliancePercentage >= 60 ? "Good" :
            compliancePercentage >= 40 ? "Fair" : "Needs Improvement"
          }
          color={
            compliancePercentage >= 80 ? "success" :
            compliancePercentage >= 60 ? "primary" :
            compliancePercentage >= 40 ? "warning" : "error"
          }
          variant="outlined"
        />
      </Paper>

      {/* Medication Summary Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Medication Summary
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={summaryData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {summaryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Weekly Compliance Trend */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Weekly Compliance Trend
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="day" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
              formatter={(value) => `${value}%`}
            />
            <Area
              type="monotone"
              dataKey="compliance"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#colorCompliance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Streaks Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Streak Performance
        </Typography>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={streakData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis type="number" stroke={theme.palette.text.secondary} />
            <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {streakData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Time Distribution */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Dose Time Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={timeDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              dataKey="percentage"
              label={({ time, percentage }) => `${time}: ${percentage}%`}
            >
              {timeDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={[COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning][index]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Additional Stats */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Total Medications Tracked
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {(stats.totalMedicationsTaken || 0) + 
                   (stats.totalMedicationsMissed || 0) + 
                   (stats.totalMedicationsSkipped || 0)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Adherence Score
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {compliancePercentage >= 80 ? "A+" :
                     compliancePercentage >= 70 ? "A" :
                     compliancePercentage >= 60 ? "B" :
                     compliancePercentage >= 50 ? "C" : "D"}
                  </Typography>
                  {compliancePercentage >= 60 ? 
                    <TrendingUp sx={{ color: COLORS.success }} /> :
                    <TrendingDown sx={{ color: COLORS.error }} />
                  }
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}