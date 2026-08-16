import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBg2AEb82yO5Sk2TPuITfdPRscoDr-P2P8",
  authDomain: "controle-de-aulas-c2973.firebaseapp.com",
  projectId: "controle-de-aulas-c2973",
  storageBucket: "controle-de-aulas-c2973.firebasestorage.app",
  messagingSenderId: "662572820697",
  appId: "1:662572820697:web:d385cbbeed6a73d3cb76c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);