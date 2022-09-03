const router = require("express").Router();
const { mongoose } = require("mongoose");
const { Schedule, validateSchedule } = require("../models/schedule");
const { User } = require("../models/user");

router.get("/:id", async (req, res) => {
  var id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  var schedule = await Schedule.findOne({ loanId: id });
  if (!schedule) {
    return res.status(404).json({ error: "Schedule not found" });
  }

  return res.status(200).send(schedule);
});

router.post("/calculator", async (req, res) => {
  return res.status(200).send(req.body);
});
module.exports = router;
