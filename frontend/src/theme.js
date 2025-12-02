import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#6366F1",
      light: "#818CF8",
      dark: "#4F46E5",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#EC4899",
      light: "#F472B6",
      dark: "#DB2777"
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669"
    },
    warning: {
      main: "#F59E0B",
      light: "#FCD34D",
      dark: "#D97706"
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626"
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    text: {
      primary: "#1E293B",
      secondary: "#64748B"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { 
      fontWeight: 800,
      fontSize: "3rem"
    },
    h2: { 
      fontWeight: 700,
      fontSize: "2.5rem"
    },
    h3: { 
      fontWeight: 700,
      fontSize: "2rem"
    },
    h4: { 
      fontWeight: 600,
      fontSize: "1.75rem"
    },
    h5: { 
      fontWeight: 600,
      fontSize: "1.5rem"
    },
    h6: { 
      fontWeight: 600,
      fontSize: "1.25rem"
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400
    },
    button: {
      textTransform: "none",
      fontWeight: 500
    }
  },
  shadows: [
    "none",
    "0px 2px 4px rgba(0,0,0,0.05)",
    "0px 4px 8px rgba(0,0,0,0.05)",
    "0px 8px 16px rgba(0,0,0,0.05)",
    "0px 12px 24px rgba(0,0,0,0.05)",
    "0px 16px 32px rgba(0,0,0,0.05)",
    "0px 20px 40px rgba(0,0,0,0.05)",
    "0px 24px 48px rgba(0,0,0,0.05)",
    "0px 32px 64px rgba(0,0,0,0.05)",
    "0px 40px 80px rgba(0,0,0,0.05)",
    "0px 48px 96px rgba(0,0,0,0.05)",
    "0px 56px 112px rgba(0,0,0,0.05)",
    "0px 64px 128px rgba(0,0,0,0.05)",
    "0px 72px 144px rgba(0,0,0,0.05)",
    "0px 80px 160px rgba(0,0,0,0.05)",
    "0px 88px 176px rgba(0,0,0,0.05)",
    "0px 96px 192px rgba(0,0,0,0.05)",
    "0px 104px 208px rgba(0,0,0,0.05)",
    "0px 112px 224px rgba(0,0,0,0.05)",
    "0px 120px 240px rgba(0,0,0,0.05)",
    "0px 128px 256px rgba(0,0,0,0.05)",
    "0px 136px 272px rgba(0,0,0,0.05)",
    "0px 144px 288px rgba(0,0,0,0.05)",
    "0px 152px 304px rgba(0,0,0,0.05)",
    "0px 160px 320px rgba(0,0,0,0.05)"
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          fontSize: "0.95rem",
          fontWeight: 500,
          boxShadow: "none",
          '&:hover': {
            boxShadow: "0px 8px 16px rgba(0,0,0,0.1)"
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0px 10px 40px rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.05)",
          backgroundImage: "none"
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: "4px 0 24px rgba(0,0,0,0.05)"
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: "#818CF8",
      light: "#A5B4FC",
      dark: "#6366F1",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#F472B6",
      light: "#F9A8D4",
      dark: "#EC4899"
    },
    success: {
      main: "#34D399",
      light: "#6EE7B7",
      dark: "#10B981"
    },
    warning: {
      main: "#FCD34D",
      light: "#FDE68A",
      dark: "#F59E0B"
    },
    error: {
      main: "#F87171",
      light: "#FCA5A5",
      dark: "#EF4444"
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { 
      fontWeight: 800,
      fontSize: "3rem"
    },
    h2: { 
      fontWeight: 700,
      fontSize: "2.5rem"
    },
    h3: { 
      fontWeight: 700,
      fontSize: "2rem"
    },
    h4: { 
      fontWeight: 600,
      fontSize: "1.75rem"
    },
    h5: { 
      fontWeight: 600,
      fontSize: "1.5rem"
    },
    h6: { 
      fontWeight: 600,
      fontSize: "1.25rem"
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400
    },
    button: {
      textTransform: "none",
      fontWeight: 500
    }
  },
  shadows: [
    "none",
    "0px 2px 4px rgba(0,0,0,0.2)",
    "0px 4px 8px rgba(0,0,0,0.2)",
    "0px 8px 16px rgba(0,0,0,0.2)",
    "0px 12px 24px rgba(0,0,0,0.2)",
    "0px 16px 32px rgba(0,0,0,0.2)",
    "0px 20px 40px rgba(0,0,0,0.2)",
    "0px 24px 48px rgba(0,0,0,0.2)",
    "0px 32px 64px rgba(0,0,0,0.2)",
    "0px 40px 80px rgba(0,0,0,0.2)",
    "0px 48px 96px rgba(0,0,0,0.2)",
    "0px 56px 112px rgba(0,0,0,0.2)",
    "0px 64px 128px rgba(0,0,0,0.2)",
    "0px 72px 144px rgba(0,0,0,0.2)",
    "0px 80px 160px rgba(0,0,0,0.2)",
    "0px 88px 176px rgba(0,0,0,0.2)",
    "0px 96px 192px rgba(0,0,0,0.2)",
    "0px 104px 208px rgba(0,0,0,0.2)",
    "0px 112px 224px rgba(0,0,0,0.2)",
    "0px 120px 240px rgba(0,0,0,0.2)",
    "0px 128px 256px rgba(0,0,0,0.2)",
    "0px 136px 272px rgba(0,0,0,0.2)",
    "0px 144px 288px rgba(0,0,0,0.2)",
    "0px 152px 304px rgba(0,0,0,0.2)",
    "0px 160px 320px rgba(0,0,0,0.2)"
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          fontSize: "0.95rem",
          fontWeight: 500,
          boxShadow: "none",
          '&:hover': {
            boxShadow: "0px 8px 16px rgba(0,0,0,0.3)"
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0px 10px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(30, 41, 59, 0.5)",
          backdropFilter: "blur(10px)"
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(10px)"
        }
      }
    }
  }
});