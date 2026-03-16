import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 5000

// ROUTES
import authRoutes from "./routes/authRoutes.js"
import channelsRoutes from "./routes/channelsRoutes.js"
import videosRoutes from "./routes/videosRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"

app.use("/api/auth", authRoutes)
app.use("/api/channels", channelsRoutes)
app.use("/api/videos", videosRoutes)
app.use("/api/reports", reportRoutes)

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    status: "AUTOLIVE API running",
    version: "1.0"
  })
})

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({
    error: "Internal Server Error"
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
