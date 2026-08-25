import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDgFDJwnOB3oQqlllNpuAnwnHkucQVoX-k",
    authDomain: "momyouneedthis.firebaseapp.com",
    projectId: "momyouneedthis",
    storageBucket: "momyouneedthis.firebasestorage.app",
    messagingSenderId: "799562796775",
    appId: "1:799562796775:web:a2a2e1bb8862ec78999c42",
    measurementId: "G-JKVZH6W85R"
  };
  
const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app);

  

  
  