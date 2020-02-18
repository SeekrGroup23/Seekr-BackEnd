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
const admin = require("firebase-admin");

// ######################################################################################################################
//                                                  Create / Insert
// ######################################################################################################################

// Add New Patient
router.post("/create", verifyToken, (req, res, next) => {
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
          createdBy: "Medical Officer",
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          nic: req.body.nic,
          dob: req.body.dob,
          gender: req.body.gender,
          height_cm: "170 Cm",
          weight_kg: "0.00 Kg",
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
          nonTransmittedDiseases: [],
          otherDiseases: [],
          specialNotes: "Add Special Notes Here",
          contact_teleNum: "",
          contact_email: "",
          isDead: false,
          no_of_clinicalVisits: 0,
          clinicalVisits: [],
          bloodGroup: req.body.bloodGroup,
          occupations: "",
          snakeBites: false,
          smokingStatus: "None",
          alchoholUsage: "None"
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
router.get("/all", verifyToken, verifyToken, (req, res, next) => {
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
        // console.log(doc.id, "=>", doc.data());
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
          gender: doc.data().gender,
          geoCordinates: doc.data().geoCordinates
        });
      });

      res.json(patientsData);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// View All Patients - Filtered
router.get("/all/:gnDivision", verifyToken, verifyToken, (req, res, next) => {
  var patientsData = [];

  let patientsRef = db.collection("patients");
  let query = patientsRef
    .where("isDeleted", "==", false)
    .where("gramaNiladhari_division", "==", req.params.gnDivision)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents." + req.params.gnDivision);
        res.json(patientsData);
        return;
      }

      snapshot.forEach(doc => {
        // console.log(doc.id, "=>", doc.data().address_perm);
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
          gender: doc.data().gender,
          address_perm: doc.data().address_perm,
          geoCordinates: doc.data().geoCordinates
        });
      });

      res.json(patientsData);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// View Individual Patient Profile Info
router.get("/profile/:id", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);
  let getDoc = patientRef
    .get()
    .then(doc => {
      if (!doc.exists) {
        res.json({ data: "empty" });
      } else {
        res.json(doc.data());
      }
    })
    .catch(err => {
      console.log("Error getting document", err);
    });
});

// ######################################################################################################################
//                                                  Update
// ######################################################################################################################

// Update Patient Info
router.put("/:id/personal", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      gender: req.body.gender,
      nic: req.body.nic,
      address_perm: req.body.address_perm,
      address_temp: req.body.address_temp ? req.body.address_temp : "null",
      contact_teleNum: req.body.contact_teleNum
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

// Update - Patient's Clinical Attendance
router.put("/:id/clinical", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      clinicalVisits: admin.firestore.FieldValue.arrayUnion(req.body)
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

// Update - Patient's Medical Info
router.put("/:id/medical", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      bloodGroup: req.body.bloodGroup,
      state: req.body.state,
      condition: req.body.condition,
      specialNotes: req.body.specialNotes,
      smokingStatus: req.body.smokingStatus,
      alchoholUsage: req.body.alchoholUsage,
      snakeBites: req.body.snakeBites,
      nonTransmittedDiseases: req.body.nonTransmittedDiseases,
      lastModified: moment().format()
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
      province: req.body.province,
      district: req.body.district,
      division: req.body.division,
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

// Update - Geo Location

router.put("/:id/geo_location", verifyToken, (req, res, next) => {
  var geoCordinates = new admin.firestore.GeoPoint(
    parseFloat(req.body.latitude),
    parseFloat(req.body.longitude)
  );
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      geoCordinates: geoCordinates
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

// Update - Diseases Info
router.put("/:id/diseases", verifyToken, (req, res, next) => {
  let patientRef = db.collection("patients").doc(req.params.id);

  let updateSingle = patientRef
    .update({
      nonTransmittedDiseases: req.body.nonTransmittedDiseases,
      otherDiseases: req.body.otherDiseases
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

// ######################################################################################################################
//                                                  Delete / Remove
// ######################################################################################################################

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
