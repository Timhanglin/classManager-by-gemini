
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyBnu_W2I5kIEDNx66bZxRw94fzZsKvs3hY",
    authDomain: "classmanager-2c72b.firebaseapp.com",
    projectId: "classmanager-2c72b",
    storageBucket: "classmanager-2c72b.firebasestorage.app",
    messagingSenderId: "136976447218",
    appId: "1:136976447218:web:68a7edb1e294537ca0826b",
    measurementId: "G-TKZ9L1NP21"
};

let dbInstance = null;
let schoolDocRef = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        dbInstance = getFirestore(app);
        schoolDocRef = doc(dbInstance, "schools", "default_school_data");
        console.log("Firebase SDK initialized");
    }
} catch (error) {
    console.warn("Firebase Init Error:", error);
}

export { dbInstance, schoolDocRef };
