const express = require("express");
const cors = require("cors");
// Routerları en üstte require et
const usersRouter = require("./routes/users");
const analyticsRouter = require("./routes/analytics");

const app = express();
app.use(cors());
app.use(express.json());

// Routerları tek sefer tanımla
app.use("/users", usersRouter);
app.use("/analytics", analyticsRouter);

app.listen(5000, () =>
  console.log("🔥 Backend running on http://localhost:5000")
);