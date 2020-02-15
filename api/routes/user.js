const express = require("express");
const router = express.Router();
const msgLogger = require("../modules/message-logger");
const db = require("../../config/firebase");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodeMailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");
const bcrypt = require("bcrypt");
const saltRounds = 10;

/**User Login Functionality */
router.post("/login", (req, res) => {
  let user;
  console.log("From Login >> " + req.headers["authorization"]);
  let userRef = db.collection("users");
  console.log(req.body.password);
  let query = userRef
    .where("email", "==", req.body.email)
    .limit(1)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        msgLogger.log("User Login - Invalid User");

        res.json({ token: "invalid" });
        return;
      } else {
        // console.log("User Found");

        //This forEach iterates Only Once
        snapshot.forEach(doc => {
          bcrypt.compare(req.body.password, doc.data().password, function(
            err,
            result
          ) {
            // result == true

            if (result == true) {
              //Creating new JSON Object for user
              user = {
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                email: doc.data().email,
                role: doc.data().role,
                id: doc.id,
                auth: true
              };

              let secretKey = fs.readFileSync(
                path.resolve("confidential/secretKey.pem"),
                "utf8"
              );
              //Sending the JSON Wen Token to the User
              jwt.sign(
                { user: user },
                secretKey,
                { expiresIn: "7200s" }, //Token Expires in 2 Hours
                (err, token) => {
                  msgLogger.log("User Login - " + user.email);
                  res.json({ token: token });
                }
              );
            } else {
              res.json({ token: "invalid" });
            }
          });
        });

        // res.json(user);
      }
    })
    .catch(err => {
      msgLogger.log("User Login - Failed" + "Error: " + err);
      console.log("Error getting documents", err);
      res.json({ token: "invalid" });
    });
});

// To Check Whether the Entered Email is Already Exists in the System
router.get("/checkEmailAvailable", (req, res, next) => {
  console.log("I`m Here");
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

module.exports = router;
