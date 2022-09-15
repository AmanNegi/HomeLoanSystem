const mongoose = require("mongoose");
const Joi = require("joi");

const loanAccountScheme = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  monthlySalary: {
    type: Number,
    required: true,
  },
  totalLoanAmount: {
    type: Number,
    required: true,
    min: 10000,
  },
  tenureInYears: {
    type: Number,
    required: true,
    min: 5,
    max: 20,
  },
  status: {
    type: String,
    default: "active",
  },
  rate: {
    type: Number,
    default: 12,
  },
  //TODO: Make the next two properties mandate
  description: {
    type: String,
    default: "",
    min: 5,
    max: 255,
  },
  addressOfProperty: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const LoanAccount = mongoose.model("Loan", loanAccountScheme);

function validateLoanAccount(body) {
  const schema = Joi.object().keys({
    userId: Joi.objectId().required(),
    monthlySalary: Joi.number().required(),
    totalLoanAmount: Joi.number().required(),
    tenureInYears: Joi.number().required().min(5).max(20),
    addressOfProperty: Joi.string().required(),
  });

  return schema.validate(body);
}

module.exports.LoanAccount = LoanAccount;
module.exports.validate = validateLoanAccount;
