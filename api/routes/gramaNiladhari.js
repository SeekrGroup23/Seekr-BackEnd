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

// Multer - to create a storage which says where and how the files/images should be saved
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./fileUploads/profileImages/gramaNiladhari/");
  },
  filename: function(req, file, callback) {
    callback(null, req.params.id + ".jpg");
  }
});

var upload = multer({
  storage: Storage
});

// ######################################################################################################################
//                                                  Create/Insert
// ######################################################################################################################

// Add New Grama NIladhari
router.post("/create", (req, res, next) => {
  var docID;

  bcrypt.hash("gn@123", saltRounds, function(err, hash) {
    //   Users Collection
    let user = db
      .collection("users")
      .add({
        email: req.body.email,
        password: hash,
        role: "Grama_Niladhari",
        dateCreated: moment().format(),
        lastModified: moment().format(),
        isDeleted: false
      })
      .then(ref => {
        console.log("Added document with ID: ", ref.id);
        docID = ref.id;
        let gramaNiladhari = db
          .collection("gramaniladhari")
          .doc(ref.id)
          .set({
            docID: ref.id,
            telNo: "",
            province: "",
            district: "",
            division: "",
            gnDivision: "",
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            dob: req.body.dob,
            title: req.body.title,
            nic: req.body.nic,
            regNo: "",
            resiAddress: "",
            email: req.body.email,
            imageURL: "",
            dateJoined: "",
            email_official: "",
            temp_address: "",
            perm_address: "",
            teleNum_Private: "",
            teleNum_official: "",
            dateCreated: moment().format(),
            createdBy: "",
            lastModified: moment().format(),
            lastModifiedBy: "",
            isDeleted: false
          })
          .then(ref => {
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>" + docID);
            res.json({
              message: "Success",
              docID: docID
            });
          })
          .catch(error => {
            res.json({ message: "Failed", error: error });
            console.log(error);
          });
      })
      .catch(error => {
        res.json({ message: "Something Went Wrong", error: error });
        console.log(error);
      });
  });
});

// Profile Image Uploading
router.post(
  "/:id/profile_image",
  upload.single("imageFile"),
  (req, res, next) => {
    const file = req.file;
    if (!file) {
      res.json({ message: "Failed - Please Upload an Image File" });
    } else {
      let moRef = db.collection("gramaniladhari").doc(req.params.id);
      console.log(req.body);
      let updateSingle = moRef
        .update({
          imageURL:
            "./fileUploads/profileImages/gramaNiladhari/" +
            req.params.id +
            ".jpg",
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
    }
  }
);

// ######################################################################################################################
//                                                  Read/Retrieval
// ######################################################################################################################

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
              perm_address: doc.data().perm_address,
              temp_address: doc.data().temp_address,

              nic: doc.data().nic,
              dateJoined: doc.data().dateCreated,
              teleNum_Private: doc.data().teleNum_Private,
              teleNum_official: doc.data().teleNum_official,

              regNo: doc.data().regNo,
              division: doc.data().division,
              divisionCode: doc.data().divisionCode,
              gnDivision: doc.data().gnDivision,
              province: doc.data().province,
              district: doc.data().district,

              title: doc.data().title,
              imageURL: doc.data().imageURL,
              email: doc.data().email,
              email_official: doc.data().email_official
            };
            // console.log(user);
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
        // user = {
        //   firstName: doc.data().firstName,
        //   lastName: doc.data().lastName,
        //   dob: doc.data().dob,
        //   address: doc.data().resiAddress,
        //   nic: doc.data().nic,
        //   dateJoined: doc.data.dateJoined,
        //   telNo: doc.data().telNo,
        //   regNo: doc.data().regNo,
        //   division: doc.data().division,
        //   divisionCode: doc.data().divisionCode,
        //   divSec: doc.data().divSec,
        //   province: doc.data.province,
        //   title: doc.data.title,
        //   imageURL: doc.data.imageURL,
        //   email: doc.data.email
        // };

        dataArray.push(doc.data());
      });

      res.send(dataArray);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// ######################################################################################################################
//                                                  Updates
// ######################################################################################################################

//  Update Personal Info
router.put("/:id/personal", (req, res, next) => {
  let personalInfo = db
    .collection("gramaniladhari")
    .doc(req.params.id)
    .update({
      teleNum_Private: req.body.teleNum_Private,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      nic: req.body.nic,
      perm_address: req.body.perm_address,
      temp_address: req.body.temp_address,
      lastModified: moment().format()
    })
    .then(ref => {
      res.json({
        message: "Success"
      });
    })
    .catch(error => {
      res.json({ status: "Something Went Wrong", error: error });
      console.log(error);
    });
}); // Add a new document with a generated id.

//  Update Professional Info
router.put("/:id/professional", (req, res, next) => {
  let personalInfo = db
    .collection("gramaniladhari")
    .doc(req.params.id)
    .update({
      district: req.body.district,
      division: req.body.division,
      gnDivision: req.body.gnDivision,
      province: req.body.province,
      regNo: req.body.regNo,
      lastModified: moment().format(),
      lastModifiedBy: req.body.lastModifiedBy
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
      res.json({
        message: "Success"
      });
    })
    .catch(error => {
      res.json({ status: "Failed", error: error });
      console.log(error);
    });
});

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

// Update GNO's Contact Information Info
router.put("/:id/contact", (req, res, next) => {
  let moRef = db.collection("gramaniladhari").doc(req.params.id);
  console.log(req.body);
  let updateSingle = moRef
    .update({
      email_official: req.body.officialEmail,
      temp_address: req.body.tempAddress,
      perm_address: req.body.permAddress,
      teleNum_Private: req.body.privateTeleNum,
      teleNum_official: req.body.officialTeleNum,
      lastModified: moment().format(),
      lastModifiedBy: req.body.lastModifiedBy
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

// ######################################################################################################################
//                                                  Deletes/Logical Deletes
// ######################################################################################################################

router.delete("/:id", (req, res, next) => {
  console.log(req.body.lastModifiedBy);
  // Get a new write batch
  let batch = db.batch();

  // Update the Users Collection
  let userRef = db.collection("users").doc(req.params.id);
  batch.update(userRef, {
    isDeleted: true,
    lastModified: moment().format(),
    lastModifiedBy: req.body.lastModifiedBy
  });

  //   Update the GramaNIladhari Collection
  let gnRef = db.collection("gramaniladhari").doc(req.params.id);
  batch.update(gnRef, {
    isDeleted: true,
    lastModified: moment().format(),
    lastModifiedBy: req.body.lastModifiedBy
  });

  // Commit the batch
  return batch
    .commit()
    .then(function() {
      res.json({
        message: "Success"
      });
    })
    .catch(error => {
      res.json({ message: "Failed", error: error });
    });
});

// Profile Image Uploading
router.post(
  "/:id/profile_image",
  upload.single("imageFile"),
  (req, res, next) => {
    const file = req.file;
    if (!file) {
      res.json({ message: "Failed - Please Upload an Image File" });
    } else {
      let gnRef = db.collection("gramaniladhari").doc(req.params.id);
      console.log(req.body);
      let updateSingle = gnRef
        .update({
          imageURL:
            "./fileUploads/profileImages/gramaNiladhari/" +
            req.params.id +
            ".jpg",
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
    }
  }
);

module.exports = router;
