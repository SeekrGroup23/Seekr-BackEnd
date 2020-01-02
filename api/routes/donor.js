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

// Add New Donor
router.post("/create", (req, res) => {
  var userRef;

  // Users Collection
  let newUser = db
    .collection("users")
    .add({
      email: req.body.email,
      password: req.body.password,
      role: "Donor",
      dateCreated: moment().format(),
      lastModified: moment().format(),
      isDeleted: false
    })
    .then(ref => {
      userRef = ref.id;

      var data;
      if (req.body.category == "Individual") {
        data = {
          firstName: req.body.name.split(" ")[0],
          lastName: req.body.name.split(" ")[1],
          category: req.body.category,
          email: req.body.email,
          imageURL: null,
          dateCreated: moment().format(),
          isDeleted: false,
          lastModified: moment().format()
        };
      } else {
        data = {
          name: req.body.name,
          category: req.body.category,
          email: req.body.email,
          imageURL: null,
          dateCreated: moment().format(),
          isDeleted: false,
          lastModified: moment().format()
        };
      }

      let newDonor = db
        .collection("donors")
        .doc(ref.id)
        .set(data)
        .then(ref => {
          res.json({
            message: "User Added Successfully"
          });
        })
        .catch(error => {
          res.json({ message: "Failed", error: error });
        });
    })
    .catch(error => {
      res.json({ message: "Something Went Wrong", error: error });
      console.log(error);
    });
});

router.get("/:id", (req, res, next) => {
  var data;
  var userID;
  try {
    userID = req.params.id;

    if (userID != null) {
      let userRef = db.collection("donors").doc(userID);
      let getDoc = userRef
        .get()
        .then(doc => {
          if (!doc.exists) {
            console.log("Document Does Not Exists");
          } else {
            // res.send(doc.data());

            if (doc.data().isDeleted == false) {
              console.log("I'm Here 01");

              if (doc.data().category == "Individual") {
                console.log("I'm Here 01");

                data = {
                  firstName: doc.data().firstName,
                  lastName: doc.data().lastName,
                  imageURL: doc.data().imageURL,
                  category: doc.data().category,
                  email: doc.data().email
                };
              } else if (doc.data().category == "Organization/Company") {
                data = {
                  name: doc.data().name,
                  imageURL: doc.data().imageURL,
                  category: doc.data().category,
                  email: doc.data().email
                };
              }
            } else {
              data = {
                message: "User Doesn't Exists"
              };
            }

            res.send(data);
          }
        })
        .catch(err => {
          console.log("Something Went Wrong! Error: " + err);
        });
    } else {
      res.send("Not Allowed");
    }
  } catch (error) {
    console.log(error);
  }
});

// router.get("/all", (req, res, next) => {});

router.put("/:id", (req, res, next) => {});

router.delete("/:id", (req, res, next) => {});

module.exports = router;
