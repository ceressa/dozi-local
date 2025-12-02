import React, { useEffect, useState, useMemo, useCallback } from "react";
import { fetchUsers } from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Skeleton,
  Paper,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  CircularProgress,
  Fade
} from "@mui/material";
import {
  Search,
  FilterList,
  Download,
  PersonAdd,
  MoreVert,
  Edit,
  Block,
  Delete,
  Star,
  StarBorder,
  CheckCircle,
  Cancel,
  Email,
  Visibility,
  Analytics as AnalyticsIcon,
  Refresh,
  ErrorOutline,
  PersonOff
} from "@mui/icons-material";
import UserDetailDrawer from "../components/UserDetailDrawer";

// Avatar Bileşeni - Memoized for performance
const UserAvatar = React.memo(({ name, email, isPremium }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: isPremium
              ? theme.palette.background.gradient || theme.palette.primary.main
              : theme.palette.action.selected,
            fontWeight: 600
          }}
        >
          {name?.charAt(0) || email?.charAt(0) || "U"}
        </Avatar>
        {isPremium && (
          <Star
            sx={{
              position: "absolute",
              bottom: -2,
              right: -2,
              fontSize: 16,
              color: "#FFC107"
            }}
          />
        )}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {name || "Unknown User"}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {email}
        </Typography>
      </Box>
    </Box>
  );
});

export default function UsersPage({ filter = "all-users" }) {
  const theme = useTheme();

  // Data States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);

  // Menu States
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTargetUser, setMenuTargetUser] = useState(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setError(null);

    try {
      const data = await fetchUsers();
      let filteredData = data;

      if (filter === "premium-users") {
        filteredData = data.filter(u => u.isPremium);
      } else if (filter === "banned-users") {
        filteredData = data.filter(u => u.banned);
      }

      setRows(filteredData.map((u) => ({ id: u.uid || u.id, ...u })));
      setError(null);
    } catch (error) {
      console.error("User fetch error:", error);
      const errorMessage = error.message || "Failed to load users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // --- HANDLERS ---
  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleMenuClick = useCallback((event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuTargetUser(user);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuTargetUser(null);
  }, []);

  const handleAction = useCallback((action) => {
    if (!menuTargetUser) return;
    const userName = menuTargetUser.name || "User";

    switch (action) {
      case "edit":
        setDrawerUser(menuTargetUser);
        setDrawerOpen(true);
        break;
      case "premium":
        toast.success(`${userName} ${menuTargetUser.isPremium ? "removed from" : "upgraded to"} premium`);
        break;
      case "ban":
        toast.error(`${userName} has been ${menuTargetUser.banned ? "unbanned" : "banned"}`);
        break;
      case "delete":
        toast.error(`${userName} has been deleted`);
        break;
      case "email":
        toast.success(`Email sent to ${userName}`);
        break;
      default:
        break;
    }
    handleMenuClose();
  }, [menuTargetUser, handleMenuClose]);

  const handleOpenDrawer = useCallback((row) => {
    setDrawerUser(row);
    setDrawerOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    if (!filteredRows || filteredRows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      // Header
      "Name,Email,Status,Plan,Timezone,Created At",
      // Rows
      ...filteredRows.map(row =>
        `"${row.name || ""}","${row.email || ""}","${row.banned ? "Banned" : "Active"}","${row.isPremium ? "Premium" : "Free"}","${row.timezone || ""}","${row.createdAt || ""}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${filter}-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredRows.length} users`);
  }, [filteredRows, filter]);

  // --- FILTERING WITH DEBOUNCED SEARCH ---
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        (row.name && row.name.toLowerCase().includes(searchLower)) ||
        (row.email && row.email.toLowerCase().includes(searchLower))
      );
    });
  }, [rows, debouncedSearch]);

  // Memoized columns
  const columns = useMemo(() => [
    {
      field: "user",
      headerName: "User",
      flex: 1.5,
      renderCell: (params) => (
        <UserAvatar
          name={params.row.name}
          email={params.row.email}
          isPremium={params.row.isPremium}
        />
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => {
        if (params.row.banned) {
          return (
            <Chip
              label="Banned"
              size="small"
              color="error"
              variant="outlined"
              icon={<Cancel />}
            />
          );
        }
        return (
          <Chip
            label="Active"
            size="small"
            color="success"
            variant="outlined"
            icon={<CheckCircle />}
          />
        );
      }
    },
    {
      field: "isPremium",
      headerName: "Plan",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Premium" : "Free"}
          size="small"
          color={params.value ? "primary" : "default"}
          variant={params.value ? "filled" : "outlined"}
          icon={params.value ? <Star /> : <StarBorder />}
        />
      )
    },
    {
      field: "timezone",
      headerName: "Location",
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {params.value || "Not set"}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleOpenDrawer(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reminder Logs">
            <IconButton
              size="small"
              onClick={() => {
                localStorage.setItem("selectedReminderUser", params.row.uid);
                window.dispatchEvent(new Event("openReminderLogs"));
              }}
            >
              <AnalyticsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="More Actions">
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, params.row)}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [handleOpenDrawer, handleMenuClick]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => !r.banned).length,
    premium: rows.filter(r => r.isPremium).length,
    banned: rows.filter(r => r.banned).length
  }), [rows]);

  const getPageTitle = () => {
    switch (filter) {
      case "premium-users": return "Premium Users";
      case "banned-users": return "Banned Users";
      default: return "All Users";
    }
  };

  const getPageSubtitle = () => {
    switch (filter) {
      case "premium-users": return "Users with active premium subscriptions";
      case "banned-users": return "Users who have been restricted from the platform";
      default: return "Complete list of registered users";
    }
  };

  // Loading skeleton component
  const StatCardSkeleton = () => (
    <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <Skeleton width={100} height={20} sx={{ mb: 1 }} />
      <Skeleton width={60} height={40} />
    </Paper>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {getPageTitle()}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {getPageSubtitle()}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.1)" : "#f0f4ff" }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Total Users</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4" }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Active Users</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.active}</Typography>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(245, 158, 11, 0.1)" : "#fffbeb" }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Premium Users</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.premium}</Typography>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.1)" : "#fef2f2" }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Banned Users</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>{stats.banned}</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Error State */}
        {error && !loading && (
          <Fade in>
            <Alert
              severity="error"
              icon={<ErrorOutline />}
              action={
                <Button color="inherit" size="small" onClick={() => loadData()}>
                  Retry
                </Button>
              }
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Tablo Kartı */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  placeholder="Search users..."
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{ width: 300 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                    )
                  }}
                />
                {searchText && (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {filteredRows.length} of {rows.length} users
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Refresh data">
                  <IconButton
                    size="small"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{
                      animation: refreshing ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } }
                    }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExport} disabled={loading || filteredRows.length === 0}>
                  Export
                </Button>
                <Button variant="contained" size="small" startIcon={<PersonAdd />} disabled>
                  Add User
                </Button>
              </Box>
            </Box>

            <Box sx={{ height: 600, width: "100%" }}>
              {loading ? (
                <Box sx={{ p: 3 }}>
                  {[...Array(8)].map((_, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={16} />
                      </Box>
                      <Skeleton width={80} height={24} />
                      <Skeleton width={80} height={24} />
                      <Skeleton width={100} height={24} />
                    </Box>
                  ))}
                </Box>
              ) : filteredRows.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 2,
                    p: 4
                  }}
                >
                  <PersonOff sx={{ fontSize: 64, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ opacity: 0.7 }}>
                    {searchText ? "No users found matching your search" : "No users available"}
                  </Typography>
                  {searchText && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSearchText("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </Box>
              ) : (
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 }
                    }
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  disableRowSelectionOnClick
                  sx={{
                    border: "none",
                    "& .MuiDataGrid-row": {
                      cursor: "pointer",
                      "&:hover": { backgroundColor: theme.palette.action.hover }
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f8f9fa",
                      color: theme.palette.text.secondary
                    },
                    "& .MuiDataGrid-cell": { borderBottom: "1px solid", borderColor: theme.palette.divider }
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction("edit")}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("premium")}>
          <ListItemIcon>{menuTargetUser?.isPremium ? <StarBorder fontSize="small" /> : <Star fontSize="small" />}</ListItemIcon>
          <ListItemText>{menuTargetUser?.isPremium ? "Remove Premium" : "Upgrade to Premium"}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("email")}>
          <ListItemIcon><Email fontSize="small" /></ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("ban")} sx={{ color: "warning.main" }}>
          <ListItemIcon><Block fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>{menuTargetUser?.banned ? "Unban User" : "Ban User"}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("delete")} sx={{ color: "error.main" }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* DÜZELTME BURADA YAPILDI:
        Drawer'a "uid" değil "selectedUser" prop'u gönderiyoruz.
        Ve içine tüm kullanıcı objesini (drawerUser) veriyoruz.
      */}
      <UserDetailDrawer
        open={drawerOpen}
        selectedUser={drawerUser}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}