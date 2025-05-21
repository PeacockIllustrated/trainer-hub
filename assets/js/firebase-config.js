// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// If you enabled Analytics:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Add serverTimestamp

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtWp4K1t3KFdsejPtCcJLdcuyKOUBdAiU", // YOUR ACTUAL KEY
  authDomain: "fitflow-f989d.firebaseapp.com",
  projectId: "fitflow-f989d",
  storageBucket: "fitflow-f989d.appspot.com", // Corrected: .appspot.com, not .firebasestorage.app
  messagingSenderId: "317876868880",
  appId: "1:317876868880:web:3e26219fba86d1d0413795",
  measurementId: "G-DCCCPP1TCK" // Optional, if Analytics is enabled
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// If you enabled Analytics (and imported getAnalytics):
// const analytics = getAnalytics(app);

// Export the initialized services so they can be used in other modules
export { app, auth, db, serverTimestamp };
