import React, { useEffect, useState } from "react";
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
  LinearProgress,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
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
  Analytics as AnalyticsIcon
} from "@mui/icons-material";
import UserDetailDrawer from "../components/UserDetailDrawer";

// Avatar Bileşeni
const UserAvatar = ({ name, email, isPremium }) => {
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
};

export default function UsersPage({ filter = "all-users" }) {
  const theme = useTheme();
  
  // Data States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Drawer States (DÜZELTİLDİ: Artık tüm kullanıcı objesini tutuyoruz)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);

  // Menu States
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTargetUser, setMenuTargetUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      let filteredData = data;
      
      if (filter === "premium-users") {
        filteredData = data.filter(u => u.isPremium);
      } else if (filter === "banned-users") {
        filteredData = data.filter(u => u.banned);
      }
      
      setRows(filteredData.map((u) => ({ id: u.uid || u.id, ...u })));
    } catch (error) {
      console.error("User fetch error:", error);
      toast.error("Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // --- MENU HANDLERS ---
  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuTargetUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTargetUser(null);
  };

  const handleAction = (action) => {
    if (!menuTargetUser) return;
    const userName = menuTargetUser.name || "User";
    
    switch (action) {
      case "edit":
        // DÜZELTME: Menüden Edit diyince Drawer için state'i güncelliyoruz
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
  };

  // --- DRAWER HANDLER ---
  const handleOpenDrawer = (row) => {
    // DÜZELTME: Sadece UID değil, tüm satır verisini (row) gönderiyoruz
    setDrawerUser(row);
    setDrawerOpen(true);
  };

  // --- FILTERING ---
  const filteredRows = rows.filter((row) => {
    const searchLower = searchText.toLowerCase();
    return (
      (row.name && row.name.toLowerCase().includes(searchLower)) ||
      (row.email && row.email.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
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
          {/* Göz İkonu: Drawer'ı Açar */}
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleOpenDrawer(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Analiz İkonu: Loglara Gider */}
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

          {/* Menü İkonu: Diğer İşlemler */}
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
  ];

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

        {/* Stats Cards (Özet Kartları) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.1)" : "#f0f4ff" }}>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Total Users</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <Skeleton width={60} /> : rows.length}</Typography>
            </Paper>
          </Grid>
          {/* Diğer kartlar benzer mantıkla devam eder, sadelik için kısalttım ama senin kodundakiler durabilir */}
          <Grid item xs={12} sm={6} md={3}>
             <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4" }}>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Active Users</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <Skeleton width={60} /> : rows.filter(r => !r.banned).length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
             <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", background: theme.palette.mode === "dark" ? "rgba(245, 158, 11, 0.1)" : "#fffbeb" }}>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Premium Users</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <Skeleton width={60} /> : rows.filter(r => r.isPremium).length}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tablo Kartı */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
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
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FilterList />}>Filter</Button>
                <Button variant="outlined" size="small" startIcon={<Download />}>Export</Button>
                <Button variant="contained" size="small" startIcon={<PersonAdd />}>Add User</Button>
              </Box>
            </Box>

            <Box sx={{ height: 600, width: "100%" }}>
              {loading ? (
                <Box sx={{ width: "100%" }}><LinearProgress /></Box>
              ) : (
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  sx={{
                    border: "none",
                    "& .MuiDataGrid-row": {
                      cursor: "pointer",
                      "&:hover": { backgroundColor: theme.palette.action.hover }
                    },
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8f9fa',
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