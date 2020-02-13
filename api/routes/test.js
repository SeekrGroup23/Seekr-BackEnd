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
const createAndSendEmail = require("../modules/email");

router.get("/get", (req, res) => {
  res.json({ message: "GET is Working :)" });
});

router.post("/post", (req, res) => {
  res.json({ message: "POST is Working :)" });
});

router.put("/put", (req, res) => {
  res.json({ message: "PUT is Working :)" });
});

router.delete("/delete", (req, res) => {
  res.json({ message: "DELETE is Working :)" });
});

router.post("/email", (req, res, next) => {
  createAndSendEmail(
    "lapjanith@gmail.com",
    "Testing Email",
    "Body of the Email"
  );
});

module.exports = router;
