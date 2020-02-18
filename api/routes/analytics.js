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

router.get("/registered_patients_year_wise", (req, res, next) => {
  var years = [];

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
        let tempDate = doc.data().dateCreated.split("T")[0];
        console.log(tempDate);

        let tempYear = tempDate.split("-")[0];
        console.log(tempYear);

        if (!years.includes(tempYear)) {
          years.push(tempYear);
        }

        // res.json(patientsData);
      });

      years.sort();
      var count = new Array(years.length).fill(0);
      var countVerified = new Array(years.length).fill(0);

      snapshot.forEach(doc => {
        let tempYear = doc
          .data()
          .dateCreated.split("T")[0]
          .split("-")[0];

        if (years.includes(tempYear)) {
          count[years.indexOf(tempYear)] = count[years.indexOf(tempYear)] + 1;
          if (doc.data().state == "Verified CKDu") {
            countVerified[years.indexOf(tempYear)] =
              countVerified[years.indexOf(tempYear)] + 1;
          }
        }

        // res.json(patientsData);
      });

      console.log(years);
      console.log(count);
      res.json({
        years: years,
        count: count,
        countVerified: countVerified
      });
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

// This Function Calculate Age From DOB
function getAge(dateString) {
  var arr = dateString.split("-");
  var dob = arr[2] + "-" + arr[1] + "-" + arr[0];
  var today = new Date();

  var birthDate = new Date(dob.toString());
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

router.get("/patients_agegroup_gender", (req, res, next) => {
  var ageGroups = ["Children", "Youth", "Adults", "Seniors"];
  var ageGroupsCount = [0, 0, 0, 0];
  var maleCount = [0, 0, 0, 0];
  var femaleCount = [0, 0, 0, 0];
  var maleFemaleCount = [0, 0];
  var female = 0;

  let patientsRef = db.collection("patients");
  let query = patientsRef
    .where("isDeleted", "==", false)
    .where("state", "==", "Verified CKDu")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        res.json(patientsData);
        return;
      }

      snapshot.forEach(doc => {
        if (getAge(doc.data().dob) > 0 && getAge(doc.data().dob) <= 14) {
          if (doc.data().gender == "Male") {
            maleCount[0] = maleCount[0] + 1;
          } else if (doc.data().gender == "Female") {
            femaleCount[0] = femaleCount[0] + 1;
          }
          ageGroupsCount[0] = ageGroupsCount[0] + 1;
        } else if (
          getAge(doc.data().dob) >= 15 &&
          getAge(doc.data().dob) <= 24
        ) {
          if (doc.data().gender == "Male") {
            maleCount[1] = maleCount[1] + 1;
          } else if (doc.data().gender == "Female") {
            femaleCount[1] = femaleCount[1] + 1;
          }
          ageGroupsCount[1] = ageGroupsCount[1] + 1;
        } else if (
          getAge(doc.data().dob) >= 25 &&
          getAge(doc.data().dob) <= 64
        ) {
          if (doc.data().gender == "Male") {
            maleCount[2] = maleCount[2] + 1;
          } else if (doc.data().gender == "Female") {
            femaleCount[2] = femaleCount[2] + 1;
          }
          ageGroupsCount[2] = ageGroupsCount[2] + 1;
        } else if (getAge(doc.data().dob) >= 65) {
          if (doc.data().gender == "Male") {
            maleCount[3] = maleCount[3] + 1;
          } else if (doc.data().gender == "Female") {
            femaleCount[3] = femaleCount[3] + 1;
          }
          ageGroupsCount[3] = ageGroupsCount[3] + 1;
        }
        if (doc.data().gender == "Male") {
          maleFemaleCount[0] = maleFemaleCount[0] + 1;
        } else if (doc.data().gender == "Female") {
          maleFemaleCount[1] = maleFemaleCount[1] + 1;
        }
      });

      console.log(ageGroupsCount);
      console.log(maleCount);
      console.log(femaleCount);
      res.json({
        ageGroups: ageGroups,
        totalCount: ageGroupsCount,
        maleCount: maleCount,
        femaleCount: femaleCount,
        maleFemaleCount: maleFemaleCount
      });
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

router.get("/patients_blood_groups", (req, res, next) => {
  var bloodGroups = ["AB+", "A+", "B+", "O+", "AB-", "A-", "B-", "O-"];
  var bloodGroupsCount = [0, 0, 0, 0, 0, 0, 0, 0];

  let patientsRef = db.collection("patients");
  let query = patientsRef
    .where("isDeleted", "==", false)
    .where("state", "==", "Verified CKDu")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        res.json(patientsData);
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.data().bloodGroup);
        if (doc.data().bloodGroup == "AB+") {
          bloodGroupsCount[0] = bloodGroupsCount[0] + 1;
        } else if (doc.data().bloodGroup == "A+") {
          bloodGroupsCount[1] = bloodGroupsCount[1] + 1;
        } else if (doc.data().bloodGroup == "B+") {
          bloodGroupsCount[2] = bloodGroupsCount[2] + 1;
        } else if (doc.data().bloodGroup == "O+") {
          bloodGroupsCount[3] = bloodGroupsCount[3] + 1;
        } else if (doc.data().bloodGroup == "AB-") {
          bloodGroupsCount[4] = bloodGroupsCount[4] + 1;
        } else if (doc.data().bloodGroup == "A-") {
          bloodGroupsCount[5] = bloodGroupsCount[5] + 1;
        } else if (doc.data().bloodGroup == "B-") {
          bloodGroupsCount[6] = bloodGroupsCount[6] + 1;
        } else if (doc.data().bloodGroup == "O-") {
          bloodGroupsCount[7] = bloodGroupsCount[7] + 1;
        }
      });

      res.json({
        bloodGroups: bloodGroups,
        bloodGroupsCount: bloodGroupsCount
      });
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

router.get("/patients_counts", (req, res, next) => {
  var verifiedCKDu = 0;
  var suspectedCKDu = 0;
  var criticalCKDu = 0;
  var totalCKDu = 0;

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
        console.log(doc.data().bloodGroup);
        if (doc.data().state == "Verified CKDu") {
          verifiedCKDu = verifiedCKDu + 1;
        } else if (doc.data().state == "Suspected CKDu") {
          suspectedCKDu[1] = suspectedCKDu[1] + 1;
        } else if (doc.data().condition == "Critical") {
          criticalCKDu[2] = criticalCKDu[2] + 1;
        }
        totalCKDu = totalCKDu + 1;
      });

      res.json({
        verified: verifiedCKDu,
        suspected: suspectedCKDu,
        critical: criticalCKDu,
        total: totalCKDu
      });
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

module.exports = router;
