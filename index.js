const app = require("express")();
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoose = require("mongoose");
const express = require("express");

const auth = require("./routes/auth");
const loans = require("./routes/loans");
const schedules = require("./routes/schedules");

mongoose.connect(
  "mongodb://localhost:27017/homeloansystem",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if(err){
      throw err;
    }
    console.log("Connected to MongoDB...");
  }
);

// Used to get request json body
app.use(express.json());

app.use("/api/login", auth);
app.use("/api/loans", loans);
app.use("/api/schedules", schedules);

app.get("/", (req, res) => {
  return res.send("Sucessfully Setup");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening at port http://localhost:${port}...`);
});

module.exports = server;
