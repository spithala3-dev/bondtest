const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser for serializing GuardLink requests
app.use(express.json());

// In-Memory database representing the current location/status of the child's phone
let childDeviceStatus = {
    deviceName: "Leo's Pixel 8 Pro",
    battery: 100,
    latitude: 37.7880,
    longitude: -122.4100,
    currentApp: "Idle",
    activities: []
};

// 1. GuardLink Sync Endpoint
app.post('/sync', (req, res) => {
    const telemetry = req.body;
    console.log("=== RECEIVED REAL-TIME TELEMETRY SYSTEM UPDATE ===");
    console.log(`Device: ${telemetry.deviceName}`);
    console.log(`Phone Battery: ${telemetry.battery}%`);
    console.log(`GPS Location: https://maps.google.com/?q=${telemetry.latitude},${telemetry.longitude}`);
    console.log(`Currently Using: ${telemetry.currentApp}`);
    console.log(`Activity Logs Count: ${telemetry.activities.length}`);

    // Store latest state locally on the server
    childDeviceStatus = telemetry;

    // Send back healthy status response and any optional commands to lock screen / take screenshot
    res.json({
        success: true,
        message: "Telemetry secured in cloud panel.",
        pendingCommands: [
            // Example command sent down to target child device
            // { commandType: "SIREN_ALARM", payload: "PLAY_ALERT" }
        ]
    });
});

// 2. Parental Panel Landing Page
app.get('/', (req, res) => {
    res.send(`
        <h1>GuardLink Parental Control Center Dashboard</h1>
        <h3>Device Managed: ${childDeviceStatus.deviceName}</h3>
        <p><b>Current Battery Level:</b> ${childDeviceStatus.battery}%</p>
        <p><b>Live Position coordinates:</b> Lat ${childDeviceStatus.latitude} / Lng ${childDeviceStatus.longitude}</p>
        <p><b>Active App in Hand:</b> ${childDeviceStatus.currentApp}</p>
        <h4>Recent Encrypted Endpoint Activities Logs:</h4>
        <pre>${JSON.stringify(childDeviceStatus.activities, null, 2)}</pre>
    `);
});

app.listen(PORT, () => {
    console.log(`GuardLink Server is online on port ${PORT}`);
});
