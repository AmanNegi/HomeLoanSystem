const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const { User, validate } = require("../models/user");

router.post("/signup", async (req, res) => {
  console.log(req.body);
  var { error } = validate(req.body);

  if (error)
    return res
      .status(404)
      .send({ success: false, message: error.details[0].message });

  try {
    var exists = await User.findOne({ email: req.body.email });
  } catch (e) {
    return res.status(404).send({
      success: false,
      message: e.message,
    });
  }

  console.log(exists);
  if (exists) {
    return res.status(400).send({
      success: false,
      message: "A user with that email already exists.",
    });
  }

  const user = new User(req.body);
  user.save();
  return res.status(200).send({ success: true, data: user });
});

router.post("/login", async (req, res) => {
  console.log(req.body);
  var { error } = validate(req.body);

  if (error)
    return res
      .status(404)
      .send({ success: false, message: error.details[0].message });

  var user;

  try {
    user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "No user exists with the specified email address.",
      });
    }
  } catch (e) {
    return res.status(404).send({
      success: false,
      message: e.message,
    });
  }

  if (user.password === req.body.password) {
    return res.status(200).send({ success: true, data: user });
  }

  return res.status(404).send({
    succes: false,
    message: "Invalid password",
  });
});

router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).send({
      success: false,
      message: "Invalid ID provided",
    });
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send({
      success: false,
      message: `No user with ID '${req.params.id}' exists `,
    });
  }
  res.status(200).send({ success: true, data: user });
});

router.get("/find/:email", async (req, res) => {
  if (!req.params.email || req.params.email.length <= 0) {
    return res.status(404).send({
      success: false,
      message: "Pass a valid email address",
    });
  }
  var user = await User.findOne({ email: req.params.email });
  if (!user) {
    return res.status(404).send({
      success: false,
      message: "No user exists with the given email address",
    });
  }

  return res.status(200).send({
    success: true,
    data: user,
  });
});

module.exports = router;
