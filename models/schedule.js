const mongoose = require("mongoose");
const Joi = require("joi");

const monthlySchema = mongoose.Schema({
  month: Number,
  outstandingAmount: Number,
  payableAmount: Number,
  intrestAmount: Number,
  status: {
    type: String,
    default: "pending",
  },
});

const scheduleSchema = mongoose.Schema({
  loanId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  emi: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  rate: {
    type: Number,
    default: 12,
  },
  tenureInYears: {
    type: Number,
    required: true,
  },
  outstandingAmount: {
    type: Number,
    required: true,
  },
  currentMonth: {
    type: Number,
    default: 1,
  },
  schedule: [monthlySchema],
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

function validateSchedule(body) {
  const schema = Joi.object().keys({
    email: Joi.string().required().email(),
    accountNumber: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(body);
}

module.exports.Schedule = Schedule;
module.exports.validate = validateSchedule;
