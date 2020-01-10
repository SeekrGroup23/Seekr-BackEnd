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
  var userDocID;
  // Add data to Users Collection
  // Add a new document with a generated id.
  let newUser = db
    .collection("users")
    .add({
      email: req.body.email,
      password: req.body.password,
      isDeleted: false,
      lastModified: moment().format(),
      lastModifiedBy: "",
      createdBy: "",
      role: "patient",
      dateCreated: moment().format()
    })
    .then(ref => {
      userDocID = ref.id;
      // Add Data to Patient Collection
      let newPatient = db
        .collection("patients")
        .doc(ref.id)
        .set({
          docID: ref.id,
          isDeleted: false,
          dateCreated: moment().format(),
          lastModified: moment().format(),
          lastModifiedBy: "",
          createdBy: "",
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          nic: req.body.nic,
          dob: req.body.dob,
          gender: req.body.gender,
          height_cm: "",
          weight_kg: "",
          state: "Normal",
          isVerified: true,
          verificationDate: "",
          verifiedBy: "",
          address_perm: "",
          address_temp: "",
          location: "",
          geoCordinates: "",
          gramaNiladhari_division: "",
          gramaNiladhari_divisionCode: "",
          province: "",
          district: "",
          specialNotes: "",
          contact_teleNum: "",
          contact_email: ""
        })
        .then(ref => {
          msgLogger.log("User Registration - Success" + " - Added 1 Patient");
          res.json({
            message: "Success",
            docID: userDocID
          });
        })
        .catch(error => {
          // In Case Something Goes Wrong with the Second Data Insertion, the Prevoiusly Created Document (In the Users Collection) Should Be Deleted
          let deleteDoc = db
            .collection("users")
            .doc(userDocID)
            .delete();
          msgLogger.log("Patient Add - Failed" + "Error : " + error);

          res.json({ status: "Create Patient Patient Failed!", error: error });
          console.log(error);
        });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// View All Patients
router.get("/all", (req, res, next) => {
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

// Update - Patient's State and Condition
router.put("/:id/state_condition", (req, res, next) => {
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
router.put("/:id/special_notes", (req, res, next) => {
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

router.put("/:id/location_address", (req, res, next) => {
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

router.put("/:id/contact_details", (req, res, next) => {
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
