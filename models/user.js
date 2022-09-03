const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = mongoose.Schema({
  accountNumber: {
    type: String,
    required: false,
    default: Math.floor(Math.random() * 1000000000),
  },
  email: {
    type: String,
    required: true,
    min: 5,
  },

  accountBalance: {
    type: Number,
    required: true,
    default: 100000000,
  },
  //TODO: Encrypt Password and then Save {Use Bcrypt Package}
  password: {
    type: String,
    required: true,
    min: 5,
  },
});

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  });

  return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validateUser;
