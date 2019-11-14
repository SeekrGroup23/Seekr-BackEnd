const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodeMailer = require("nodemailer");
var moment = require("moment");
var multer = require("multer");

var appRoot = require("app-root-path");

// HTTP Logging Middleware
var morgan = require("morgan");

var winston = require("./config/winston");

// Imports the Google Cloud client library
// const { Storage } = require("@google-cloud/storage");
moment().format();

/**Firebase */
const admin = require("firebase-admin");
var serviceAccount = require("./serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "seekr-e5169.appspot.com"
});

// Database Object
var db = admin.firestore();
//Storage Bucket Object
// var bucket = admin.storage().bucket();

// Get a reference to the storage service, which is used to create references in your storage bucket
// var bucket = admin.storage().bucket();

/**Initializing Express App */
const app = express();

//Using the CORS Middleware
app.use(cors());

// HTTP Logging Middleware
app.use(morgan("combined", { stream: winston.stream }));

/*Body Parser Middleware */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Multer - to create a storage which says where and how the files/images should be saved
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./fileUploads");
  },
  filename: function(req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({
  storage: Storage
});

/*---------------------------------------------------------------------------------------------------------- */
/**This routing URLs for testing purposes only */

// GET Request Testing
app.get("/api/testing/get", (req, res) => {
  res.send("Message From Server ->  GET is Working :)");
});

// POST Request Testing
app.post("/api/testing", (req, res) => {
  res.send("Message From Server ->  POST is Working :)");
});

// Firestore Testing
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
app.get("/api/testing/jwt_authentication", verifyToken, (req, res) => {
  res.json({ message: "Hi! there from server. Authentication Success." });
});

// JSON Web Token Generation Testing
app.get("/api/testing/jwt", verifyToken, (req, res) => {
  let user;

  //Creating new JSON Object for user
  user = {
    firstName: "Pasindu",
    lastName: "Dewapriya",
    email: "pd@gmail.com",
    role: "admin",
    id: "sdkfnskjfkskjiw234892fsdk",
    auth: true
  };

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
});

// Image and File Upload Testing URL
app.post("/api/testing/file_upload_cloud", (req, res) => {
  // fs.readFile("./fileUploads/image.jpg", (err, data) => {
  //   if (err) throw err;
  //   let encodedData = data.toString("base64");
  //   // console.log(encodedData);
  //   res.send(encodedData);
  // });

  // Create a storage reference from our storage service

  bucket.upload(
    "./fileUploads/user.png",
    {
      destination: "ProfilePics/user.png",
      public: true,
      metadata: {
        cacheControl: "public, max-age=31536000"
      }
    },
    function(err, file) {
      if (err) {
        console.log(err);
        return;
      }
      // console.log(createPublicFileURL("profilePics/image.jpg"));
    }
  );
  // fs.readFile("./fileUploads/image.jpg", (err, data) => {
  //   if (err) throw err;
  //   var file = data; // use the Blob or File API
  //   ref.put(file).then(function(snapshot) {
  //     console.log("Uploaded a blob or file!");
  //   });
  // });
});

app.post(
  "/api/testing/file_upload_local",
  upload.single("image"),
  verifyToken,
  function(req, res, next) {
    const file = req.file;
    if (!file) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      return next(error);
    }
    res.send(file);
  }
);
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
            id: doc.id,
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

/*------------------------------------------------------------------------------------------------------------------------------------ */

// Grama Niladhari

app.get("/api/gramaniladhari/get_profile", (req, res, next) => {
  var user;
  var userID = req.query.id;
  let userRef = db.collection("users").doc(userID);
  let getDoc = userRef
    .get()
    .then(doc => {
      if (!doc.exists) {
      } else {
        // res.send(doc.data());
        user = {
          firstName: doc.data().firstname,
          lastName: doc.data().lastname,
          email: doc.data().email,
          dob: "21242142",
          nameInFull: "sdfsfsdf",
          address: "sdfsdfs",
          maritalStatus: "Single",
          nic: "2343432153425v",
          gender: "M",
          mobile: "0123123131"
        };
        console.log(user);

        res.send(user);
      }
    })
    .catch(err => {
      console.log("Oops!, Something Went Wrong!", err);
    });
});

// Getting All Patients Data

app.get("api/gramaniladhari/get_all_patients", (req, res, next) => {});

/*---------------------------------------------------------------------------------------------- */

//Setting the PORT which listening to the Request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started on Port ${PORT}`));
