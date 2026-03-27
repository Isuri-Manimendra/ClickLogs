const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
app.post('/saveTaps', async (req, res) => {
    try {
        const { id: sessionId, var: device, taps } = req.body;
        const tapsArray = JSON.parse(taps);

        const tapPromises = tapsArray.map(tap => {
            if (!tap.startTimestamp || !tap.endTimestamp) return Promise.resolve();

            const tapRecord = {
                sessionId,
                device,
                tapSequenceNumber: tap.tapSequenceNumber,
                startTimestamp: new Date(tap.startTimestamp),
                endTimestamp: new Date(tap.endTimestamp),
                duration: tap.endTimestamp - tap.startTimestamp,
                interface: tap.interface,
                createdAt: admin.firestore.FieldValue.serverTimestamp() // Use server-side time
            };
            console.log("Saving:", tapRecord);

            return db.collection("tap_logs").add(tapRecord);
        });

        // Wait for ALL writes to finish before responding
        await Promise.all(tapPromises);
        console.log("Data saved successfully");
        res.status(200).send("Data saved successfully");
    } catch (err) {
        console.error("Firestore Save Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));