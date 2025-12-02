import { useEffect, useState } from "react";
import { fetchReminderLogs } from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";

export default function ReminderLogsPage({ uid }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!uid) return;

    fetchReminderLogs(uid).then(data => {
      const mapped = data.map(log => ({
        id: log.id,
        type: log.type ?? "unknown",
        createdAt: log.createdAt ? new Date(log.createdAt).toLocaleString() : "No time"
      }));
      setRows(mapped);
    });
  }, [uid]);

  const columns = [
    { field: "id", headerName: "ID", width: 260 },
    { field: "type", headerName: "Type", width: 160 },
    { field: "createdAt", headerName: "Time", width: 220 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Reminder Logs
      </Typography>

      <div style={{ height: 500, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} pageSize={20} />
      </div>
    </Box>
  );
}
