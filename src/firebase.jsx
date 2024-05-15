// src/firebase.js (hoặc tạo một tệp tương tự)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyAMCvAcEli7Yb3FOG9dkaxMQQO5O9CZDKI",
  authDomain: "ccproject-33fb1.firebaseapp.com",
  projectId: "ccproject-33fb1",
  storageBucket: "ccproject-33fb1.appspot.com",
  messagingSenderId: "942464392509",
  appId: "1:942464392509:web:4fd81d3ce9e2ce3746f954"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
