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
const verifyToken = require("../middlewares/verifyToken");

// View All Patients
router.get("/metadata_01", (req, res, next) => {
  var patientsData = [];

  let metaRef = db.collection("metadata").doc("metadata_01");
  let query = metaRef
    .get()
    .then(doc => {
      if (!doc.exists) {
        console.log("No such document!");
      } else {
        res.json(doc.data());
      }
    })
    .catch(err => {
      console.log("Error getting documents", err);
      res.json({ message: "Failed", error: err });
    });
});

// View Individual Patient Profile Info
router.get("/:id", (req, res, next) => {});

// Update Patient Info
router.put("/:id", (req, res, next) => {});

// Delete an Patient
router.delete("/:id", (req, res, next) => {
  // Get a new write batch
  let batch = db.batch();
  // Patient's Reference
  let patientsRef = db.collection("patients").doc(req.params.id);

  // User's Reference
  let usersRef = db.collection("users").doc(req.params.id);

  let updatePatient = batch.update(patientsRef, { isDeleted: true });
  let updateUser = batch.update(usersRef, { isDeleted: true });

  // Commit the batch
  return batch
    .commit()
    .then(function() {
      res.json({ message: "Success" });
    })
    .catch(err => {
      res.json({ message: "Failed", error: err });
    });
});

module.exports = router;
