// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// If you enabled Analytics:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // We'll need this soon

// Your web app's Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtWp4K1t3KFdsejPtCcJLdcuyKOUBdAiU",
  authDomain: "fitflow-f989d.firebaseapp.com",
  projectId: "fitflow-f989d",
  storageBucket: "fitflow-f989d.firebasestorage.app",
  messagingSenderId: "317876868880",
  appId: "1:317876868880:web:3e26219fba86d1d0413795",
  measurementId: "G-DCCCPP1TCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// If you enabled Analytics:
// const analytics = getAnalytics(app);

// Export the initialized services so they can be used in other modules
export { app, auth, db /*, analytics (if enabled) */ };
