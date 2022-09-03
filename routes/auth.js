const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const { User, validate } = require("../models/user");

router.post("/", async (req, res) => {
  console.log(req.body);
  var { error } = validate(req.body);

  if (error)
    return res
      .status(404)
      .send({ success: true, message: error.details[0].message });

  var exists = await User.findOne({ email: req.body.email });
  console.log(exists);
  if (exists) {
    return res
      .status(400)
      .send({
        success: true,
        message: "A user with that email already exists.",
      });
  }

  const user = new User(req.body);
  user.save();
  return res.status(200).send(user);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).send("Invalid ID");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send(`No user with ID '${req.params.id}' exists `);
  }
  res.status(200).send(user);
});

module.exports = router;
