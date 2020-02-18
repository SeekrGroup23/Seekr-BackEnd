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
const admin = require("firebase-admin");
const verifyToken = require("../middlewares/verifyToken");

// Add New Patient
router.post("/create", verifyToken, (req, res, next) => {
  var userDocID;
  console.log(req.body.latitude + " " + req.body.longitude);
  var geoCordinates = new admin.firestore.GeoPoint(
    parseFloat(req.body.latitude),
    parseFloat(req.body.longitude)
  );
  // Add data to Users Collection
  // Add a new document with a generated id.
  let newUser = db
    .collection("hospitals")
    .add({
      isDeleted: false,
      lastModified: moment().format(),
      lastModifiedBy: "",
      dateCreated: moment().format(),
      createdBy: "",
      name: req.body.name,
      registration_no: req.body.regNo,
      province: req.body.province,
      district: req.body.district,
      division: req.body.division,
      category: req.body.category,
      address: req.body.address,
      geoCordinates: geoCordinates
    })
    .then(ref => {
      res.json({ message: "Success", data: ref });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// View All Patients
router.get("/all", verifyToken, (req, res, next) => {
  var patientsData = [];

  let patientsRef = db.collection("patients");
  let query = patientsRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        res.json(patientsData);
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.id, "=>", doc.data());
        patientsData.push({
          dateCreated: doc.data().dateCreated,
          email: doc.data().email,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          dob: doc.data().dob,
          nic: doc.data().nic,
          docID: doc.data().docID,
          state: doc.data().state,
          location: doc.data().location,
          gender: doc.data().gender
        });
      });

      res.json(patientsData);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// To Get All Hospitals as a List of Names
router.get("/all/list", verifyToken, (req, res, next) => {
  var tempArray = [];
  let hospitalRef = db.collection("hospitals");
  let query = hospitalRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.id, "=>", doc.data());
        tempArray.push({
          name: doc.data().name,
          docID: doc.id
        });
      });

      res.json(tempArray);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// View Individual Patient Profile Info
router.get("/:id", verifyToken, (req, res, next) => {});

// View All Hospital Info
router.get("/", (req, res, next) => {
  var tempArray = [];
  let hospitalRef = db.collection("hospitals");
  let query = hospitalRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.id, "=>", doc.data());
        tempArray.push(doc.data());
      });

      res.json(tempArray);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// Update Patient Info
router.put("/:id", verifyToken, (req, res, next) => {});

// Delete an Patient
router.delete("/:id", verifyToken, (req, res, next) => {
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

// Update - Patient's State and Condition
router.put("/:id/state_condition", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      state: req.body.state,
      condition: req.body.condition
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
});

// Update - Patient's Special Notes
router.put("/:id/special_notes", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      special_notes: req.body.specialNotes
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
});

// Update - Location and Address

router.put("/:id/location_address", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      address_perm: req.body.address_perm,
      address_temp: req.body.address_temp,
      gramaNiladhari_division: req.body.gramaNiladhari_division
    })
    .then(() => {
      res.json({
        message: "Success"
      });
    })
    .catch(err => {
      console.log(err);
    });
});

// Update - Contact Details

router.put("/:id/contact_details", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      contact_teleNum: req.body.contactTeleNum,
      contact_email: req.body.contactEmail
    })
    .then(() => {
      res.json({
        message: "Success"
      });
    })
    .catch(err => {
      console.log(err);
    });
});

module.exports = router;
