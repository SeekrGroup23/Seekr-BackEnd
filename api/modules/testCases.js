app.get("/api/testing/get", (req, res) => {
  msgLogger.log("Testing - GET Request");
  res.send("Message From Server ->  GET is Working :)");
});
