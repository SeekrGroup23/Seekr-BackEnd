const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodeMailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");
const passwordHash = require("password-hash");

var appRoot = require("app-root-path");

var msgLogger = require("./modules/message-logger");

// HTTP Logging Middleware
var morgan = require("morgan");

var winston = require("./config/winston");

// Imports the Google Cloud client library
// const { Storage } = require("@google-cloud/storage");
moment().format();

/**Firebase */
const admin = require("firebase-admin");
var serviceAccount = require("./serviceKey.json.js");
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

// // CORS middleware
// const allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', '*');
//   res.header('Access-Control-Allow-Headers', '*');
//   next();
// }

// app.use(allowCrossDomain)
app.use(cors());

// HTTP Logging Middleware
app.use(morgan("combined", { stream: winston.stream }));

/*Body Parser Middleware */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Routes

const userRoutes = require("./api/routes/user");

app.use("/api/user", userRoutes);

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
  msgLogger.log("Testing - GET Request");
  res.send("Message From Server ->  GET is Working :)");
});

// POST Request Testing
app.post("/api/testing/post", (req, res) => {
  msgLogger.log("Testing - POST Request");
  res.send("Message From Server ->  POST is Working :)");
});

// Firestore Testing
app.get("/api/testing/firestore", (req, res) => {
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
  msgLogger.log("Testing - JSON Web Token Authetication");

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
      msgLogger.log("Testing - JSON Web Token Generation");

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

/* ******************User Registration***************** */

app.post("/api/generalUser/registration", (req, res) => {
  var hashedPassword = passwordHash.generate(req.body.password);
  // Add a new document with a generated id.
  let newUser = db
    .collection("users")
    .add({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      isPatient: req.body.isPatient,
      isDeleted: false,
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      msgLogger.log("User Registration - Success" + " - Added 1 User");

      res.json({
        email: req.body.email,
        password: req.body.password
      });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

//Donor Registration

app.post("/api/donor/registration", (req, res) => {
  // Add a new document with a generated id.
  var hashedPassword = passwordHash.generate(req.body.password);

  let newUser = db
    .collection("users")
    .add({
      name: req.body.name,
      category: req.body.category,
      email: req.body.email,
      password: req.body.password,
      dateCreated: moment().format(),
      isDeleted: true
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
  var userID;
  try {
    userID = req.query.docId;

    if (userID != null) {
      let userRef = db.collection("gramaniladhari").doc(userID);
      let getDoc = userRef
        .get()
        .then(doc => {
          if (!doc.exists) {
          } else {
            // res.send(doc.data());
            let gender;
            if (doc.data().gender == "Female") gender = "F";
            else if (doc.data().gender == "Male") gender = "M";
            else gender = "O";

            user = {
              firstName: doc.data().fName,
              lastName: doc.data().lName,
              dob: "1990-01-01",
              nameInFull: "sdfsfsdf",
              address: doc.data().resiAddress,
              maritalStatus: "Single",
              nic: doc.data().nicNum,
              gender: gender,
              mobile: "0123123131",
              gid: doc.data().regNum,
              division: doc.data().division,
              divisionCode: doc.data().divisionNum,
              divSec: "Isadeen"
            };
            console.log(user);

            res.send(user);
          }
        })
        .catch(err => {
          console.log("Oops!, Something Went Wrong!", err);
        });
    } else {
      res.send("Not Allowed");
    }
  } catch (error) {
    console.log(error);
  }
});

//  Update Personal Info
app.post("/api/gramaniladhari/personal/update", (req, res, next) => {
  console.log("I`m Here @Update Method " + req.body.email);
  let personalInfo = db
    .collection("gramaniladhari")
    .doc(req.body.email)
    .set({
      fName: req.body.firstName,
      lName: req.body.lastName,
      nameInFull: req.body.nameInFull,
      dob: req.body.dob,
      gender: req.body.gender,
      nicNum: req.body.nic,
      maritalStatus: req.body.maritalStatus,
      resiAddress: req.body.address
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res
        .json({
          email: req.body.email,
          password: req.body.password
        })
        .catch(error => {
          res.json({ status: "Something Went Wrong", error: error });
          console.log(error);
        });
    });
}); // Add a new document with a generated id.

/*----------------------------------------------Patients---------------------------------------------------- */

// Add Patient
app.post("/api/patient/register", (req, res, next) => {
  // Add data to Users Collection
  // Add a new document with a generated id.
  let newUser = db
    .collection("users")
    .add({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      isPatient: req.body.isPatient,
      nic: req.body.nic,
      isDeleted: false,
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      msgLogger.log("User Registration - Success" + " - Added 1 User");

      // res.json({
      //   email: req.body.email,
      //   password: req.body.password
      // });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });

  // Add Data to Patient Collection
  let newPatient = db
    .collection("patients")
    .doc(req.body.nic)
    .set({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      nic: req.body.nic,
      isDeleted: false,
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      msgLogger.log("User Registration - Success" + " - Added 1 User");

      res.json({
        email: req.body.email
        // password: req.body.password
      });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// Add Patient
app.post("/api/patient/general_info/add", (req, res, next) => {
  // Add data to Users Collection
  // Add a new document with a generated id.
  let genInfo = db
    .collection("patients")
    .doc(req.body.nic)
    .set({
      nameInFull: req.nameInFull,
      dob: req.dob,
      gender: req.gender,
      maritalStatus: req.maritalStatus,
      ageAtMarriage: req.ageAtMarriage
    })
    .then(ref => {
      console.log("General Information is Added Successfully ", ref.id);
      msgLogger.log("General Information is Added Successfully");

      // res.json({
      //   email: req.body.email,
      //   password: req.body.password
      // });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// Getting All Patients Data
app.get("/api/patient/get_all", (req, res, next) => {
  let patientsRef = db.collection("patients");
  let query = patientsRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }
      var data = [];
      snapshot.forEach(doc => {
        console.log(doc.id, "=>", doc.data());
        data.push(doc.data());
      });
      res.send(data);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

/*----------------------------------------------------------------------------------------------------------------------- */
//  Questionnaire

// General Information - Add/Create New
app.post("/api/questionnaire/general_information/add", (req, res, next) => {
  // Add a new document with a generated id.
  let genInfo = db
    .collection("questionnaire")
    .add({
      firstName: "Test",
      lastName: "Test",
      nameInFull: "sdfsdfsdf",
      dob: "123123123",
      gender: "sdfsd",
      maritalStatus: "sdfsdf",
      ageAtMarriage: "213",
      dateCreated: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res.json({
        response: "Data Added Successfully"
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// General Information - Update
app.put("api/questionnaire/general_information/update", (req, res, next) => {});

// General Information - View
app.get("api/questionnaire/general_information/view", (req, res, next) => {});

// General Information - Delete
app.delete(
  "api/questionnaire/general_information/delete",
  (req, res, next) => {}
);

/*---------------------------------------------------------------------------------------------- */

//Setting the PORT which listening to the Request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started on Port ${PORT}`));
