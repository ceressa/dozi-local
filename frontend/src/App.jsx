import { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "./theme";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";


import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  ListItemButton,
  Collapse,
  Chip,
  Button
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Medication as MedicationIcon,
  FamilyRestroom as FamilyIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Person as PersonIcon,
  AutoGraph as AutoGraphIcon
} from "@mui/icons-material";

import UsersPage from "./pages/UsersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DashboardPage from "./pages/DashboardPage";
import ReminderLogsPage from "./pages/ReminderLogsPage";
import AllRemindersPage from "./pages/AllRemindersPage";



const drawerWidth = 280;
const miniDrawerWidth = 80;

const menuItems = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: <DashboardIcon />,
    badge: "NEW"
  },
  { 
    id: "users", 
    label: "Users", 
    icon: <PeopleIcon />,
    subItems: [
      { id: "all-users", label: "All Users", icon: <PersonIcon /> },
      { id: "premium-users", label: "Premium Users", icon: <PersonIcon /> },
      { id: "banned-users", label: "Banned Users", icon: <PersonIcon /> }
    ]
  },
  {
  id: "analytics",
  label: "Analytics",
  icon: <AnalyticsIcon />,
  subItems: [
    { id: "analytics-main", label: "Overview", icon: <AnalyticsIcon /> },
    { id: "all-reminders", label: "All Reminders", icon: <NotificationsIcon /> }
  ]
},

  { 
    id: "medications", 
    label: "Medications", 
    icon: <MedicationIcon />,
    disabled: true 
  },
  { 
    id: "family", 
    label: "Family Plans", 
    icon: <FamilyIcon />,
    disabled: true 
  },
  { 
    id: "reports", 
    label: "Reports", 
    icon: <AutoGraphIcon />,
    disabled: true 
  }
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [notifications, setNotifications] = useState(3);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("doziAdminTheme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    }
  }, []);
  
  useEffect(() => {
  const listener = () => {
    setPage("reminder-logs");
  };
  window.addEventListener("openReminderLogs", listener);
  return () => window.removeEventListener("openReminderLogs", listener);
}, []);


  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("doziAdminTheme", newMode ? "dark" : "light");
  };

  const handleExpandClick = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: theme.palette.background.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 3
            }}
          >
            <Typography variant="h6" sx={{ color: "white", fontWeight: 800 }}>
              D
            </Typography>
          </Box>
          {drawerOpen && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Dozi Admin
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Healthcare Management
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <List sx={{ flex: 1, px: 1, mt: 1 }}>
        {menuItems.map((item) => (
          <Box key={item.id}>
            <ListItemButton
              onClick={() => {
                if (item.subItems) {
                  handleExpandClick(item.id);
                } else if (!item.disabled) {
                  setPage(item.id);
                  setMobileOpen(false);
                }
              }}
              disabled={item.disabled}
              selected={page === item.id}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                mx: 1,
                "&.Mui-selected": {
                  background: theme.palette.background.gradient,
                  color: "white",
                  "&:hover": {
                    background: theme.palette.background.gradient,
                    opacity: 0.9
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white"
                  }
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: drawerOpen ? 40 : "auto",
                  justifyContent: "center"
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawerOpen && (
                <>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.95rem",
                      fontWeight: page === item.id ? 600 : 500
                    }}
                  />
                  {item.badge && (
                    <Chip 
                      label={item.badge} 
                      size="small" 
                      color="secondary"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  )}
                  {item.subItems && (
                    expandedItems[item.id] ? <ExpandLess /> : <ExpandMore />
                  )}
                </>
              )}
            </ListItemButton>

            {item.subItems && drawerOpen && (
              <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.id}
                      onClick={() => {
                        setPage(subItem.id);
                        setMobileOpen(false);
                      }}
                      selected={page === subItem.id}
                      sx={{
                        pl: 4,
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        "&.Mui-selected": {
                          backgroundColor: "rgba(99, 102, 241, 0.1)"
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={subItem.label}
                        primaryTypographyProps={{
                          fontSize: "0.9rem"
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {}}
          sx={{ borderRadius: 2, mb: 1 }}
        >
          <ListItemIcon sx={{ minWidth: drawerOpen ? 40 : "auto" }}>
            <SettingsIcon />
          </ListItemIcon>
          {drawerOpen && <ListItemText primary="Settings" />}
        </ListItemButton>

        {drawerOpen && (
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: theme.palette.mode === "dark" 
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
              border: "1px solid",
              borderColor: theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  background: theme.palette.background.gradient
                }}
              >
                U
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Ufuk Admin
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  ufuk@dozi.com
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              size="small"
              startIcon={<LogoutIcon />}
              sx={{ mt: 1 }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.palette.mode === "dark" ? "#1E293B" : "#fff",
            color: theme.palette.text.primary,
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            borderRadius: "12px",
            padding: "16px"
          }
        }}
      />

      <Box 
        sx={{ 
          display: "flex",
          minHeight: "100vh",
          background: theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
            : "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)"
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : miniDrawerWidth}px)` },
            ml: { sm: `${drawerOpen ? drawerWidth : miniDrawerWidth}px` },
            background: theme.palette.mode === "dark"
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            boxShadow: "none",
            borderBottom: "1px solid",
            borderColor: theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            color: theme.palette.text.primary
          }}
        >
          <Toolbar sx={{ px: 3 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2, display: { xs: "none", sm: "inline-flex" } }}
            >
              {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>

            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {menuItems.find(item => item.id === page)?.label || 
               menuItems.flatMap(item => item.subItems || []).find(sub => sub.id === page)?.label ||
               "Dashboard"}
            </Typography>

            <IconButton onClick={handleThemeToggle} sx={{ mr: 1 }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton sx={{ mr: 1 }}>
              <Badge badgeContent={notifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                background: theme.palette.background.gradient,
                cursor: "pointer"
              }}
            >
              U
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ 
            width: { sm: drawerOpen ? drawerWidth : miniDrawerWidth }, 
            flexShrink: { sm: 0 } 
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth
              }
            }}
          >
            {drawer}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerOpen ? drawerWidth : miniDrawerWidth,
                transition: theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen
                }),
                overflowX: "hidden"
              }
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : miniDrawerWidth}px)` },
            mt: 8
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
            >
              {page === "dashboard" && <DashboardPage />}
              {(page === "users" || page === "all-users" || page === "premium-users" || page === "banned-users") && 
                <UsersPage filter={page} />}
              {page === "analytics-main" && <AnalyticsPage />}
			  {page === "reminder-logs" && <ReminderLogsPage />}
			  {page === "all-reminders" && <AllRemindersPage />}

            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </ThemeProvider>
  );
}