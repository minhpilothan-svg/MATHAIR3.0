const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDgXDyUryMpFUKJzY6gzNIFfoXSEMy23KU",
    authDomain: "mathair-8ac04.firebaseapp.com",
    projectId: "mathair-8ac04",
    storageBucket: "mathair-8ac04.firebasestorage.app",
    messagingSenderId: "328600425826",
    appId: "1:328600425826:web:5d1f2630dd0948d052083b",
    measurementId: "G-ZGJVTV66V1"
};

// Initialize Firebase
let firebaseInitialized = false;
let firebaseAuth = null;
let firebaseDb = null;

try {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Make available globally
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.firebaseAuth = firebaseAuth;
window.firebaseDb = firebaseDb;