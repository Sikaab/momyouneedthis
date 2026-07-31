
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDgFDJwnOB3oQqlllNpuAnwnHkucQVoX-k",
    authDomain: "momyouneedthis.firebaseapp.com",
    projectId: "momyouneedthis",
    storageBucket: "momyouneedthis.firebasestorage.app",
    messagingSenderId: "799562796775",
    appId: "1:799562796775:web:a2a2e1bb8862ec78999c42",
    measurementId: "G-JKVZH6W85R"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);