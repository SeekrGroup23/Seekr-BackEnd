const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const morgan = require('morgan');

//adding routes
//const adminRoutes = require('./api/routes/admin');

/**Initializing Express App */
const app = express();
app.use(morgan('dev'));
app.use(cors());

/**Firebase */
const admin = require("firebase-admin");
var serviceAccount = require("./serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
var db = admin.firestore();

/*Body Parser Middleware */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//Admin functions

app.post('/admin/add/grama', (req,res) => {

  /* const gramaNiladhari = {
      fName:req.body.fName,
      lName:req.body.lName,
      email:req.body.email,
      conNumber:req.body.conNumber
       
   };*/

  let gramaCollection = db.collection("gramaniladhari");
  gramaCollection.add({
    fName: req.body.fName,
    lName: req.body.fName,
    gender:req.body.gender,
    email:req.body.email,
    cNumber:req.body.cNumber,
    resiAddress:req.body.resiAddress,
    province:req.body.province,
    /* district:req.body.district, */
    division:req.body.division,
    divisionNum:req.body.divisionNum,
    regNum:req.body.regNum

  }).then(documentReference => {
      let firestore = documentReference.firestore;
      console.log(`Root location for document is ${firestore.formattedName}`);
    });
 
  res.status(200).json({
      message: 'added grama niladhari',
      createdGrama: gramaNiladhari
  });
});









//Routes which handles requests
//app.use('/admin', adminRoutes);

/*---------------------------------------------------------------------------------------------------------- */
/**This routing URL for testing purposes only */
app.get("/api/testing", (req, res) => {
  //   res.send("Ayubowan!, Node-Express");

  var docRef = db.collection("users").doc("admin-root1");

  var setUser = docRef.set({
    firstName: "Thusara",
    lastName: "Deemantha",
    email: "th@gmail.com",
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
        res.json({ auth: false });
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

//error handeling

app.use((req,res,next)=>{
  const error = new error('Not Found');
  error.status = 404;
  next(error);
})

app.use((error,req,res,next)=>{
  res.status(error.status || 500);
  res.json({
    error:{
      message:error.message
    }
  })
})

//cors errors handeling

app.use((req,res,next) => {
  res.header("Access-Control-Allow-Origin","*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if(req.method === 'OPTIONS'){
    res.header('Access-Control-Allow-Methodes','PUT,POST,GET,PATCH,DELETE');
    return res.status(200).json({});
  }
  next();
})

//Setting the PORT which listening to the Request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started on Port ${PORT}`));
