import firebase from "firebase";
import "firebase/firestore";
import "firebase/storage";
import "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK0QMDqSolR_ML5Amcdqf925UG1FuUQtE",
  authDomain: "foodhosts.firebaseapp.com",
  projectId: "foodhosts",
  storageBucket: "foodhosts.appspot.com",
  messagingSenderId: "857400664151",
  appId: "1:857400664151:web:13ceae9cbbceb47fecc312",
  measurementId: "G-HV73E9LFDS",
};
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
