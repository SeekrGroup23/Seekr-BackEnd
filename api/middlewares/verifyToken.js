/******Authentication Middleware******
 * Format of Token
 * Authoriazation: Bearer <access_token>
 */

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

//Verify Token
const verifyToken = function(req, res, next) {
  //Get the secret key from the secretKey.pem file
  let secretKey = fs.readFileSync("./confidential/secretKey.pem", "utf8");
  // Get Auth Header Value
  const bearerHeader = req.headers["authorization"];

  //Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //Split at Space to get the token value seperated from the rest of the http header
    const bearer = bearerHeader.split(" ");

    //Get the token from array
    const bearerToken = bearer[1];

    //set the token
    // req.token = bearerToken;

    jwt.verify(
      bearerToken,
      secretKey,
      { algorithm: "HS256" },
      (err, userData) => {
        if (err) {
          // res.sendStatus(403);
          // res.send("Testing..." + err);
          res.sendStatus(403);
          throw new Error(err);
        }
        // else {
        //   res.json({ mode: "Testing...", auth: true, authData: authData });
        // }

        //Next Middleware
        return next();
      }
    );
  } else {
    //Access Denied
    res.sendStatus(403);
    throw new Error("Not Authorized");
  }
};

module.exports = verifyToken;
