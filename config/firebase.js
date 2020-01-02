/**Firebase -Firestore Real Time Database */
const admin = require("firebase-admin");
var serviceAccount = require("../confidential/serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "seekr-e5169.appspot.com"
});

// Database Object
var db = admin.firestore();

module.exports = db;
