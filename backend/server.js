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
        const sessionId = req.body.id;
        const device = req.body.var;
        const tapsArray = JSON.parse(req.body.taps);

        // Process each tap individually
        tapsArray.forEach(async (tap) => {

            if (!tap.startTimestamp || !tap.endTimestamp) return;

            const duration = tap.endTimestamp - tap.startTimestamp;

            const tapRecord = {
                sessionId: sessionId,
                device: device,
                tapSequenceNumber: tap.tapSequenceNumber,
                startTimestamp: tap.startTimestamp,
                endTimestamp: tap.endTimestamp,
                duration: duration,
                interface: tap.interface,
                interfaceSequence: tap.interfaceSequence,
                createdAt: new Date()
            };

            console.log("Saving:", tapRecord);

            await db.collection("tap_logs").add(tapRecord);
        });

        res.send("Data saved successfully");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));