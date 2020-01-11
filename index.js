const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const url = require("url");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodeMailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");
const passwordHash = require("password-hash");

var appRoot = require("app-root-path");

var msgLogger = require("./api/modules/message-logger");

// HTTP Logging Middleware
var morgan = require("morgan");

var winston = require("./config/winston");

moment().format();

/**Initializing Express App */
const app = express();

//Using the CORS Middleware

// // CORS middleware
// const allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', '*');
//   res.header('Access-Control-Allow-Headers', '*');
//   next();
// }

// app.use(allowCrossDomain)
app.use(cors());

// HTTP Logging Middleware
app.use(morgan("combined", { stream: winston.stream }));

/*Body Parser Middleware */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Routes

const userRoutes = require("./api/routes/user");
const donorRoutes = require("./api/routes/donor");
const medicalOfficerRoutes = require("./api/routes/medicalOfficer");
const adminRoutes = require("./api/routes/admin");
const patientRoutes = require("./api/routes/patient");
const gramaNiladhariRoutes = require("./api/routes/gramaNiladhari");
const hospitalRoutes = require("./api/routes/hospital");

app.use("/api/user", userRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/medical_officer", medicalOfficerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/gramaniladhari", gramaNiladhariRoutes);
app.use("/api/hospital", hospitalRoutes);

// Multer - to create a storage which says where and how the files/images should be saved
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./fileUploads");
  },
  filename: function(req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({
  storage: Storage
});

//Setting the PORT which listening to the Request
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started on Port ${PORT}`));
