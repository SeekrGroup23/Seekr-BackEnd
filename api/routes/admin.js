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

// Add New Admin
router.post("/create", (req, res, next) => {});

// View All Admins
router.get("/all", (req, res, next) => {});

// View Individual Admin Profile Info
router.get("/:id", (req, res, next) => {});

// Update Admin Info
router.put("/:id", (req, res, next) => {});

// Delete an Admin
router.delete("/:id", (req, res, next) => {});

module.exports = router;
