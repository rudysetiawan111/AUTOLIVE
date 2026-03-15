// backend/server.js

require("dotenv").config()

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")

const { createServer } = require("http")
const { Server } = require("socket.io")

const mongoose = require("mongoose")

const videoQueue = require("./queues/videoQueue")
const uploadQueue = require("./queues/uploadQueue")
const analyticsQueue = require("./queues/analyticsQueue")

const scheduler = require("./automation/scheduler")

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer,{
    cors:{
        origin:"*"
    }
})

const PORT = process.env.PORT || 5000

/* =========================
DATABASE
========================= */

async function connectDB(){

    try{

        await mongoose.connect(process.env.MONGODB_URI)

        console.log("MongoDB Connected")

    }catch(err){

        console.error("MongoDB Error",err)
        process.exit(1)

    }

}

connectDB()

/* =========================
MIDDLEWARE
========================= */

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(morgan("dev"))

/* =========================
API ROUTES
========================= */

app.post("/api/automation/start", async(req,res)=>{

    const { videoUrl } = req.body

    const job = await videoQueue.add("process-video",{
        videoUrl
    })

    res.json({
        success:true,
        jobId:job.id
    })

})

/* =========================
HEALTH CHECK
========================= */

app.get("/health",(req,res)=>{

    res.json({
        status:"ok",
        uptime:process.uptime()
    })

})

/* =========================
SOCKET.IO
========================= */

io.on("connection",(socket)=>{

    console.log("client connected",socket.id)

})

/* =========================
START SERVER
========================= */

httpServer.listen(PORT,()=>{

    console.log("AUTOLIVE SERVER RUNNING")
    console.log("PORT",PORT)

})

scheduler.initialize()

module.exports = {app,httpServer,io}
