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

// Add New Patient
router.post("/create", (req, res, next) => {
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

// View All Patients
router.get("/all", (req, res, next) => {});

// View Individual Patient Profile Info
router.get("/:id", (req, res, next) => {});

// Update Patient Info
router.put("/:id", (req, res, next) => {});

// Delete an Patient
router.delete("/:id", (req, res, next) => {});

module.exports = router;
