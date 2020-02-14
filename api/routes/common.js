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

// Get Image by Image URL
router.post("/get_image", (req, res, next) => {
  console.log(req.body.imageURL);

  let buff = fs.readFileSync(path.resolve(req.body.imageURL));
  let base64data = buff.toString("base64");
  res.json({ img: base64data });
});

module.exports = router;
