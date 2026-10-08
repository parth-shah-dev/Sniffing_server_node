const express = require("express");
const axios = require("axios");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("Client connected");

    // =========================
    // 🔗 URL ANALYSIS
    // =========================
    socket.on("analyze", async (url) => {
        const start = Date.now();

        try {
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            const time = Date.now() - start;

            let risk = "Low";
            if (!url.startsWith("https")) risk = "Medium";
            if (time > 2000) risk = "High";

            socket.emit("result", {
                status: response.status,
                time: time,
                headers: response.headers,
                risk: risk
            });

        } catch (err) {
            console.log(err.message);
            socket.emit("result", { error: "Failed", risk: "High" });
        }
    });

    // =========================
    // 📡 PACKET SNIFFING (REAL-TIME)
    // =========================
    let sniffProcess;

    socket.on("start-sniff", () => {

        // 🧹 kill old process if running
        if (sniffProcess) sniffProcess.kill();

        sniffProcess = spawn("python", ["-u", "sniffer.py"]);

        sniffProcess.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");

            lines.forEach(line => {
                if (line.trim() !== "") {
                    socket.emit("packet", line + "\n");
                }
            });
        });

        sniffProcess.stderr.on("data", (data) => {
            console.log("ERROR:", data.toString());
        });

        sniffProcess.on("close", () => {
            console.log("Sniffer stopped");
        });
    });

    socket.on("stop-sniff", () => {
        if (sniffProcess) {
            sniffProcess.kill();
            sniffProcess = null;
        }
    });

});

app.get("/", (req, res) => {
    res.send("Server running");
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});

