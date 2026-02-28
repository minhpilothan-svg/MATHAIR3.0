// firebase-config.js - Firebase configuration shared by all modules

const FIREBASE_CONFIG = {
    PROJECT_ID: "mathair-8ac04",
    API_KEY: "AIzaSyDgXDyUryMpFUKJzY6gzNIFfoXSEMy23KU",
    BASE_URL: `https://firestore.googleapis.com/v1/projects/mathair-8ac04/databases/(default)/documents`
};

// Make available globally
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
