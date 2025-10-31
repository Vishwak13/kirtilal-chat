import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 10000;

// Your n8n production webhook URL
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/kirtilal-chat";

// ✅ Allowed WordPress origins (staging + optional future production)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ||
  "https://staging-c660-admin3b9cbb4aef.wpcomstaging.com,https://www.kirtilal.com";

const allowList = ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);

const app = express();

// Strict CORS setup
app.use(cors({
  origin: function (origin, cb) {
    // Allow no-origin requests (like curl) or requests from allowList
    if (!origin || allowList.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
  maxAge: 86400 // cache preflight for 24 hours
}));

app.use(express.json({ limit: "1mb" }));

// Main proxy route
app.post("/kirtilal-chat", async (req, res) => {
  try {
    const origin = req.headers.origin || "";
    if (origin && !allowList.includes(origin)) {
      return res.status(403).send("Origin not allowed");
    }

    // Forward request to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    res.status(response.status).type("text/plain").send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error");
  }
});

// Health check
app.get("/", (_req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`✅ Proxy running on port ${PORT}`);
});
