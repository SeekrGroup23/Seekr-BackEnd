const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodeMailer = require("nodemailer");
var moment = require("moment");
moment().format();

/**Firebase */
const admin = require("firebase-admin");
var serviceAccount = require("./serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
var db = admin.firestore();

/**Initializing Express App */
const app = express();

//Using the CORS Middleware
app.use(cors());

/*Body Parser Middleware */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

/*---------------------------------------------------------------------------------------------------------- */
/**This routing URL for testing purposes only */
app.get("/api/testing", (req, res) => {
  //   res.send("Ayubowan!, Node-Express");

  var docRef = db.collection("users").doc("admin-root");

  var setUser = docRef.set({
    firstName: "Pasind",
    lastName: "Dewapriya",
    email: "pd@gmail.com",
    password: "1234",
    role: "admin"
  });

  res.json({ status: "Success" });
});

//Testing JWT -Authentication
app.get("/api/testing-jwt", verifyToken, (req, res) => {
  res.json({ message: "Hi! there from server" });
});
/*-------------------------------------------------------------------------------------- */

/**User Login Functionality */
app.post("/api/login", (req, res) => {
  let user;

  let userRef = db.collection("users");
  console.log(req.body.password);
  let query = userRef
    .where("email", "==", req.body.email)
    .where("password", "==", req.body.password)
    .limit(1)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        res.json({ token: "invalid" });
        return;
      } else {
        // console.log("User Found");

        //This forEach iterates Only Once
        snapshot.forEach(doc => {
          //Creating new JSON Object for user
          user = {
            firstName: doc.data().firstName,
            lastName: doc.data().lastName,
            email: doc.data().email,
            role: doc.data().role,
            auth: true
          };
        });

        let secretKey = fs.readFileSync("./secretKey.pem", "utf8");
        //Sending the JSON Wen Token to the User
        jwt.sign(
          { user: user },
          secretKey,
          { expiresIn: "7200s" }, //Token Expires in 2 Hours
          (err, token) => {
            res.json({ token: token });
          }
        );
        // res.json(user);
      }
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

/******Authentication Middleware******
 * Format of Token
 * Authoriazation: Bearer <access_token>
 */
//Verify Token
function verifyToken(req, res, next) {
  //Get the secret key from the secretKey.pem file
  let secretKey = fs.readFileSync("./secretKey.pem", "utf8");
  // Get Auth Header Value
  const bearerHeader = req.headers["authorization"];

  //Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //Split at Space to get the token value seperated from the rest of the http header
    const bearer = bearerHeader.split(" ");

    //Get the token from array
    const bearerToken = bearer[1];

    //set the token
    // req.token = bearerToken;

    jwt.verify(
      bearerToken,
      secretKey,
      { algorithm: "HS256" },
      (err, userData) => {
        if (err) {
          // res.sendStatus(403);
          // res.send("Testing..." + err);
          res.sendStatus(403);
          throw new Error(err);
        }
        // else {
        //   res.json({ mode: "Testing...", auth: true, authData: authData });
        // }

        //Next Middleware
        return next();
      }
    );
  } else {
    //Access Denied
    res.sendStatus(403);
    throw new Error("Not Authorized ****");
  }
}

/* ******************User Registration***************** */

app.post("/api/generalUser/registration", (req, res) => {
  // Add a new document with a generated id.
  let newUser = db
    .collection("users")
    .add({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res.json({
        email: req.body.email,
        password: req.body.password
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

//Donor Registration

app.post("/api/donor/registration", (req, res) => {
  // Add a new document with a generated id.
  let newUser = db
    .collection("users")
    .add({
      name: req.body.name,
      category: req.body.category,
      email: req.body.email,
      password: req.body.password,
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res.json({
        email: req.body.email,
        password: req.body.password
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

app.get("/api/checkEmailAvailable", (req, res) => {
  let usersRef = db.collection("users");
  let queryRef = usersRef
    .where("email", "==", req.query.email)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        // console.log('No matching documents.');
        res.json({ matchFound: false });
      } else {
        res.json({ matchFound: true });
      }
      return;
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

//Setting the PORT which listening to the Request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started on Port ${PORT}`));
