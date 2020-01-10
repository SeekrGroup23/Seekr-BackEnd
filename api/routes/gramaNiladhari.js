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

// Add New Grama NIladhari
router.post("/create", (req, res, next) => {
  //   Users Collection
  let user = db
    .collection("users")
    .add({
      email: req.body.email,
      password: req.body.password,
      role: "Grama_Niladhari",
      dateCreated: moment().format(),
      lastModified: moment().format(),
      isDeleted: false
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);

      let gramaNiladhari = db
        .collection("gramaniladhari")
        .doc(ref.id)
        .set({
          telNo: req.body.telNo,
          district: req.body.district,
          division: req.body.division,
          divSec: req.body.divSec,
          divisionCode: req.body.divisionCode,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          dob: req.body.dob,
          title: req.body.title,
          nic: req.body.nic,
          province: req.body.province,
          regNo: req.body.regNo,
          resiAddress: req.body.resiAddress,
          email: req.body.email,
          imageURL: req.body.imageURL,
          dateJoined: req.body.dateJoined,
          dateCreated: moment().format(),
          lastModified: moment().format(),
          isDeleted: false
        })
        .then(ref => {
          res.json({
            message: "User Created Successfully"
          });
        })
        .catch(error => {
          res.json({ message: "Something Went Wrong", error: error });
          console.log(error);
        });
    })
    .catch(error => {
      res.json({ message: "Something Went Wrong", error: error });
      console.log(error);
    });
});

// Get Individual Profile Info
router.get("/:id", (req, res, next) => {
  var user;
  var userID;
  try {
    userID = req.params.id;

    if (userID != null) {
      let userRef = db.collection("gramaniladhari").doc(userID);
      let getDoc = userRef
        .get()
        .then(doc => {
          if (!doc.exists) {
          } else {
            // res.send(doc.data());

            user = {
              firstName: doc.data().firstName,
              lastName: doc.data().lastName,
              dob: doc.data().dob,
              address: doc.data().resiAddress,
              nic: doc.data().nic,
              dateJoined: doc.data.dateJoined,
              telNo: doc.data().telNo,
              regNo: doc.data().regNo,
              division: doc.data().division,
              divisionCode: doc.data().divisionCode,
              divSec: doc.data().divSec,
              province: doc.data.province,
              title: doc.data.title,
              imageURL: doc.data.imageURL,
              email: doc.data.email
            };
            res.send(user);
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

//   Get all Profiles - for Admin Usage
router.get("/", (req, res, next) => {
  console.log("I`m Here");
  var dataArray = [];
  let gnsRef = db.collection("gramaniladhari");
  let query = gnsRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        res.json({ message: "No Matching Documents!" });
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.id, "=>", doc.data());
        user = {
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          dob: doc.data().dob,
          address: doc.data().resiAddress,
          nic: doc.data().nic,
          dateJoined: doc.data.dateJoined,
          telNo: doc.data().telNo,
          regNo: doc.data().regNo,
          division: doc.data().division,
          divisionCode: doc.data().divisionCode,
          divSec: doc.data().divSec,
          province: doc.data.province,
          title: doc.data.title,
          imageURL: doc.data.imageURL,
          email: doc.data.email
        };

        dataArray.push(user);
      });

      res.send(dataArray);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

//  Update Personal Info
router.put("/:id/personal", (req, res, next) => {
  let personalInfo = db
    .collection("gramaniladhari")
    .doc(req.params.id)
    .update({
      telNo: req.body.telNo,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      title: req.body.title,
      nic: req.body.nic,
      imageURL: req.body.imageURL,
      lastModified: moment().format()
    })
    .then(ref => {
      res.json({
        message: "Updated Successfully"
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
}); // Add a new document with a generated id.

//  Update General Info
router.put("/:id/general", (req, res, next) => {
  let personalInfo = db
    .collection("gramaniladhari")
    .doc(req.params.id)
    .update({
      district: req.body.district,
      division: req.body.division,
      divSec: req.body.divSec,
      divisionCode: req.body.divisionCode,
      province: req.body.province,
      regNo: req.body.regNo,
      lastModified: moment().format()
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res.json({
        message: "Updated Successfully"
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
});

//  Update Other Info
router.put("/:id/other", (req, res, next) => {
  // Get a new write batch
  let batch = db.batch();

  // Update the Users Collection
  let userRef = db.collection("users").doc(req.params.id);
  batch.update(userRef, {
    email: req.body.email,
    password: req.body.password,
    lastModified: moment().format()
  });

  //   Update the GramaNIladhari Collection
  let gnRef = db.collection("gramaniladhari").doc(req.params.id);
  batch.update(gnRef, {
    email: req.body.email,
    lastModified: moment().format()
  });

  // Commit the batch
  return batch
    .commit()
    .then(function() {
      res.json({
        message: "Updated Successfully"
      });
    })
    .catch(error => {
      res.json({ message: "Update Failed!", error: error });
    });
});

router.delete("/:id", (req, res, next) => {
  // Get a new write batch
  let batch = db.batch();

  // Update the Users Collection
  let userRef = db.collection("users").doc(req.params.id);
  batch.update(userRef, {
    isDeleted: true,
    lastModified: moment().format()
  });

  //   Update the GramaNIladhari Collection
  let gnRef = db.collection("gramaniladhari").doc(req.params.id);
  batch.update(gnRef, {
    isDeleted: true,
    lastModified: moment().format()
  });

  // Commit the batch
  return batch
    .commit()
    .then(function() {
      res.json({
        message: "Deleted Successfully"
      });
    })
    .catch(error => {
      res.json({ message: "Delete Failed!", error: error });
    });
});

module.exports = router;
