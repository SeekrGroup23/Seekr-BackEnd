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

// Set Patients Count
router.post("/patients/count", (req, res, next) => {
  var registered;
  // Read the Document

  let patientRef = db.collection("patients").doc(req.body.patientID);
  let getDoc = patientRef
    .get()
    .then(doc => {
      if (!doc.exists) {
        // res.json({ data: "empty" });
      } else {
        // Extract Relavent Data
        let analyticsRef = db.collection("analytics").doc("country");
        let getDoc = analyticsRef
          .get()
          .then(doc => {
            if (!doc.exists) {
              // res.json({ data: "empty" });
            } else {
              // Process the Data
              registered = doc.data().total_registered_patients;

              // Write the Analytics to corresponding Documents
              let updateSingle = analyticsRef
                .update({
                  total_registered_patients: registered + 1
                })
                .then(() => {
                  res.json({
                    message: "Success"
                  });
                })
                .catch(err => {
                  console.log(err);
                  res.json({
                    message: "Failed",
                    error: err
                  });
                });
            }
          })
          .catch(err => {
            console.log("Error getting document", err);
          });
      }
    })
    .catch(err => {
      console.log("Error getting document", err);
    });
});

module.exports = router;
