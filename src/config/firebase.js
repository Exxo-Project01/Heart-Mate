
import Firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyC_uv5-QB8LDGV82HHoMlzKKDlJvA2tDMk",
    authDomain: "dengue-20fc0.firebaseapp.com",
    databaseURL: "https://dengue-20fc0.firebaseio.com",
    projectId: "dengue-20fc0",
    storageBucket: "dengue-20fc0.appspot.com",
    messagingSenderId: "607639649061",
    appId: "1:607639649061:web:22f610c500a9f80271b8cc"
  };
  let app = Firebase.initializeApp(firebaseConfig);
export const db = app.database();
