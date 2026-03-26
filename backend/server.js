const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/saveTaps', async (req, res) => {
    try {
        const sessionId = req.body.id;
        const device = req.body.var;
        const tapsArray = JSON.parse(req.body.taps);

        // Process each tap individually
        tapsArray.forEach((tap) => {

            // skip invalid taps
            if (!tap.startTimestamp || !tap.endTimestamp) return;

            const tapRecord = {
                sessionId: sessionId,
                device: device,
                tapSequenceNumber: tap.tapSequenceNumber,
                startTimestamp: tap.startTimestamp,
                endTimestamp: tap.endTimestamp,
                interface: tap.interface
            };

            console.log("Tap Record:", tapRecord);
        });

        res.send("Data saved successfully");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));