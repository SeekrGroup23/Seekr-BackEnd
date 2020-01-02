var fs = require("fs");
var appRoot = require("app-root-path");

exports.log = function(message) {
  let dateTime = new Date();
  // adjust 0 before single digit date
  let date = ("0" + dateTime.getDate()).slice(-2);

  // current month
  let month = ("0" + (dateTime.getMonth() + 1)).slice(-2);

  // current year
  let year = dateTime.getFullYear();

  // current hours
  let hours = dateTime.getHours();

  // current minutes
  let minutes = dateTime.getMinutes();

  // current seconds
  let seconds = dateTime.getSeconds();

  let timeStamp =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  fs.appendFile(
    `${appRoot}/logs/msgLog.txt`,
    timeStamp + " -> " + message + "\n",
    function(err) {
      if (err) throw err;
      console.log("Saved!");
    }
  );
};
