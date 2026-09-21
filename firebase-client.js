import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const config = window.VA_FIREBASE_CONFIG || {};
const configured = ["apiKey","authDomain","projectId","appId"].every(k => String(config[k] || "").trim());
let auth = null;
let db = null;
let ready = false;

function emit(name, detail={}) { window.dispatchEvent(new CustomEvent(name, {detail})); }

async function loadTracker(user) {
  if (!db || !user) return {};
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.exists() ? snap.data() : {};
  return data.tracker && typeof data.tracker === "object" ? data.tracker : {};
}

async function saveTracker(user, tracker) {
  if (!db || !user) throw new Error("Database is not ready.");
  await setDoc(doc(db, "users", user.uid), {
    email: user.email || "",
    tracker: tracker || {},
    updatedAt: serverTimestamp()
  }, {merge:true});
}

window.VAConnectCloud = {
  isConfigured: () => configured && ready,
  isReady: () => ready,
  signIn: async (email, password) => {
    if (!auth) throw new Error("Firebase Authentication is not configured yet.");
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  },
  createAccount: async (email, password) => {
    if (!auth) throw new Error("Firebase Authentication is not configured yet.");
    return (await createUserWithEmailAndPassword(auth, email, password)).user;
  },
  signOut: async () => {
    if (auth) await firebaseSignOut(auth);
  },
  loadTracker,
  saveTracker,
  currentUser: () => auth?.currentUser || null
};

if (!configured) {
  ready = true;
  emit("va:firebase-ready", {configured:false});
} else {
  try {
    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    ready = true;
    emit("va:firebase-ready", {configured:true});
    onAuthStateChanged(auth, async user => {
      emit("va:auth-state", {user, loading:true});
      if (user) {
        try {
          const tracker = await loadTracker(user);
          emit("va:auth-state", {user, tracker, loading:false});
        } catch (error) {
          emit("va:auth-state", {user, tracker:{}, loading:false, error});
        }
      } else {
        emit("va:auth-state", {user:null, tracker:{}, loading:false});
      }
    });
  } catch (error) {
    ready = true;
    emit("va:firebase-ready", {configured:false, error});
  }
}
