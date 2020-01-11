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

// Multer - to create a storage which says where and how the files/images should be saved
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./fileUploads/profileImages/medicalOfficer/");
  },
  filename: function(req, file, callback) {
    callback(null, req.params.id + ".jpg");
  }
});

var upload = multer({
  storage: Storage
});

// Add New Doctor
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
      role: "medical_officer",
      dateCreated: moment().format()
    })
    .then(ref => {
      userDocID = ref.id;
      // Add Data to Patient Collection
      let newPatient = db
        .collection("medicalofficers")
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
          imageURL: "",
          doctorRegistrationNo: "",
          perm_address: "",
          temp_address: "",
          teleNum_official: "",
          teleNum_Private: "",
          designation: "",
          specialty: "",
          currentWorking_hospitalName: "",
          currentWorking_hospitalCode: "",
          notes: "",
          email_official: ""
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
          msgLogger.log("Medical Officer Add - Failed" + "Error : " + error);

          res.json({ status: "Create Medical Officer Failed!", error: error });
          console.log(error);
        });
    })
    .catch(error => {
      msgLogger.log("User Registration - Failed" + "Error : " + error);

      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

router.post(
  "/:id/profile_image",
  upload.single("imageFile"),
  (req, res, next) => {
    const file = req.file;
    if (!file) {
      res.json({ message: "Failed - Please Upload an Image File" });
    } else {
      res.json({ message: "Success" });
    }
  }
);

// View All Doctor
router.get("/all", (req, res, next) => {});

// View Individual Doctor Profile Info
router.get("/:id", (req, res, next) => {});

// Update Doctor's Professional Info
router.put("/:id/professional", (req, res, next) => {
  let moRef = db.collection("medicalofficers").doc(req.params.id);
  console.log(req.body);
  let updateSingle = moRef
    .update({
      docRegistrationNo: req.body.regNo,
      specialty: req.body.specialty,
      designation: req.body.designation,
      lastModified: moment().format(),
      lastModifiedBy: ""
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

// Update Doctor's Contact Information Info
router.put("/:id/contact", (req, res, next) => {
  let moRef = db.collection("medicalofficers").doc(req.params.id);
  console.log(req.body);
  let updateSingle = moRef
    .update({
      email_official: req.body.officialEmail,
      temp_address: req.body.tempAddress,
      perm_address: req.body.permAddress,
      teleNum_Private: req.body.privateTeleNum,
      teleNum_official: req.body.officialTeleNum,
      lastModified: moment().format(),
      lastModifiedBy: ""
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

// Update Doctor's Work Place Info - Work Place Assignment
router.put("/:id/work_place", (req, res, next) => {
  let moRef = db.collection("medicalofficers").doc(req.params.id);
  console.log(req.body);
  let updateSingle = moRef
    .update({
      currentWorking_hospitalCode: req.body.docID,
      currentWorking_hospitalName: req.body.name
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

// Delete an Doctor
router.delete("/:id", (req, res, next) => {});

module.exports = router;
