const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory databases for live tracking data and pending parent commands
const deviceTelemetry = {};
const pendingCommands = {};

// Root / Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: "online", 
        service: "GuardLink Live Sync Cloud Node",
        message: "Use /dashboard to view tracked devices." 
    });
});

// 1. Telemetry and Logs Sync Endpoint (POST /sync)
// Android child app periodically POSTs coordinates, battery, and logs here.
app.post('/sync', (req, res) => {
    const { deviceName, battery, latitude, longitude, currentApp, activities } = req.body;
    
    if (!deviceName) {
        return res.status(400).json({ success: false, message: "Missing deviceName" });
    }

    console.log(`[SYNC RECEIVED] Device: '${deviceName}' | Battery: ${battery}%`);
    console.log(`Location: Lat ${latitude}, Lng ${longitude} | Active App: ${currentApp}`);
    console.log(`Syncing ${activities ? activities.length : 0} detailed activity records.`);

    // Store latest state
    deviceTelemetry[deviceName] = {
        battery,
        latitude,
        longitude,
        currentApp,
        activities: activities || [],
        lastSeen: new Date().toISOString()
    };

    // Retrieve pending commands for this child device
    const commands = pendingCommands[deviceName] || [];
    pendingCommands[deviceName] = []; // Reset commands queue once consumed

    res.json({
        success: true,
        message: "Cloud database synchronized successfully.",
        pendingCommands: commands
    });
});

// 2. Fetch Pending Commands Endpoint (GET /commands)
app.get('/commands', (req, res) => {
    const deviceName = req.query.deviceName;
    if (!deviceName) {
        return res.status(400).json({ error: "Missing 'deviceName' query parameter" });
    }

    const commands = pendingCommands[deviceName] || [];
    pendingCommands[deviceName] = []; // Clear queue on retrieval
    res.json(commands);
});

// 3. Queue Live Parental Commands (POST /command)
// Call this from Postman or your web browser to trigger immediate actions on the child mobile!
// Example payload: { "deviceName": "Leo's Pixel 8 Pro", "commandType": "SIREN", "payload": "play" }
app.post('/command', (req, res) => {
    const { deviceName, commandType, payload } = req.body;
    if (!deviceName || !commandType) {
        return res.status(400).json({ success: false, message: "Missing deviceName or commandType" });
    }

    if (!pendingCommands[deviceName]) {
        pendingCommands[deviceName] = [];
    }

    pendingCommands[deviceName].push({ commandType, payload: payload || "" });
    console.log(`[COMMAND ENQUEUED] ${commandType} for target device [${deviceName}]`);

    res.json({ success: true, message: `Command '${commandType}' successfully put on standby queue.` });
});

// 4. Parental Dashboard API (GET /dashboard)
// Access this url in your web container/mobile browser to inspect live tracked devices in real-time
app.get('/dashboard', (req, res) => {
    res.json(deviceTelemetry);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`GuardLink Cloud Server listening on port ${PORT}`);
});
