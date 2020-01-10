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

// Add New Doctor
router.post("/create", (req, res, next) => {});

// View All Doctor
router.get("/all", (req, res, next) => {});

// View Individual Doctor Profile Info
router.get("/:id", (req, res, next) => {});

// Update Doctor Info
router.put("/:id", (req, res, next) => {});

// Delete an Doctor
router.delete("/:id", (req, res, next) => {});

module.exports = router;
