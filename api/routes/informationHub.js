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

// /api/information_hub/create
router.post("/create", (req, res, next) => {
  console.log(req.body);
  // Add a new document with a generated id.
  let addDoc = db
    .collection("posts")
    .add({
      title: req.body.title,
      author: req.body.author,
      content: req.body.content,
      dateCreated: moment().format(),
      isDeleted: false
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
    });
});

router.get("/all", (req, res) => {
  var array = [];
  let postsRef = db.collection("posts");
  let query = postsRef
    .where("isDeleted", "==", false)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }

      snapshot.forEach(doc => {
        array.push(doc.data());
      });
      res.json(array);
    })
    .catch(err => {
      console.log("Error getting documents", err);
    });
});

router.delete("/id:",(req,res))

module.exports = router;
