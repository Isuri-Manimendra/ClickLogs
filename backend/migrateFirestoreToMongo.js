import admin from 'firebase-admin';
import { MongoClient } from 'mongodb';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import dotenv from 'dotenv';
dotenv.config();

// 1. Initialize Firebase Firestore
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const firestore = admin.firestore();

// 2. MongoDB Configuration
const client = new MongoClient(process.env.MONGO_URI);
const dbName = process.env.DB_NAME;

async function migrateData() {
    try {
        console.log("Starting Migration...");

        // Connect to MongoDB Atlas
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        const mongoDb = client.db(dbName);
        const mongoCol = mongoDb.collection("tap_logs");

        // 3. Extract from Firestore
        console.log("Fetching records from Firestore...");
        const snapshot = await firestore.collection("tap_logs").get();

        if (snapshot.empty) {
            console.log("No data found in Firestore to migrate.");
            return;
        }

        // 4. Transform data for MongoDB
        const records = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                sessionId: data.sessionId,
                device: data.device,
                interface: data.interface,
                tapSequenceNumber: data.tapSequenceNumber,
                duration: Number(data.duration),
                // Handle Timestamp to Date conversion properly
                startTimestamp: data.startTimestamp.toDate(),
                endTimestamp: data.endTimestamp.toDate(),
                createdAt: data.createdAt.toDate()
            };
        });

        // 5. Load into MongoDB
        console.log("Cleaning destination collection...");
        await mongoCol.deleteMany({});

        console.log(`Inserting ${records.length} records into MongoDB...`);
        const result = await mongoCol.insertMany(records);

        console.log(`Migration Complete! Inserted ${result.insertedCount} documents.`);

    } catch (error) {
        console.error("Migration Failed:", error);
    } finally {
        await client.close();
        console.log("MongoDB Connection Closed.");
    }
}

await migrateData();