const express = require("express");
const cors = require("cors");
const { mongoConnect } = require("./connet");
const urlRoute = require("./routes/url");
const authRoute = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const URL = require("./MODELS/url");
const cookieParser = require("cookie-parser");
const device = require("express-device");
const cron = require("node-cron");
const { getAnalytics, redirectToOriginalUrl } = require("./controllers/url");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(device.capture());

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 8005;

mongoConnect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error", err));

app.use("/auth", authRoute);
app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.use("/url", urlRoute);

app.get("/urllist", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching URLs for user:", userId);
    const urls = await URL.find({ userId: userId });
    console.log("Fetched URLs:", urls);
    res.json(urls);
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.status(500).json({ error: "Failed to fetch URLs." });
  }
});


app.get("/redirect/:shortId", async (req, res) => {
  const shortId = req.params.shortId;

  try {
    const url = await URL.findOne({ shortId });

    if (!url) {
      return res.status(404).send("URL not found");
    }

    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      return res.status(410).send("This link has expired.");
    }

    const ipAddress = req.ip; // Get the user's IP address
    const userAgent = req.headers["user-agent"]; // Get detailed user-agent info
    const deviceType = req.device.type; // Get the device type (mobile, tablet, desktop)

    url.visithistory.push({
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      deviceType, // Store the device type
    });

    await url.save();

    res.redirect(url.redirectURL);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get('/r/:shortId', redirectToOriginalUrl);

app.get('/analytics/:shortId', authMiddleware, getAnalytics);


cron.schedule("0 0 * * *", async () => {
  try {
    const result = await URL.deleteMany({ expiresAt: { $lte: new Date() } }); // Cleanup expired links
    console.log(`Cleaned up ${result.deletedCount} expired links.`);
  } catch (err) {
    console.error("Error cleaning up expired links:", err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

