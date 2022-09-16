const router = require("express").Router();
const { mongoose } = require("mongoose");
const { LoanAccount, validate } = require("../models/loan_account");
const { User } = require("../models/user");
const { Schedule } = require("../models/schedule");
const { calculateEmi, getScheduleList } = require("../helper/calculations");
const { errorHandler, successHandler } = require("../helper/response_handler");

router.get("/:userId", async (req, res) => {
  var userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return errorHandler(res, "Invalid User Identity");
  }

  try {
    var user = await User.findById(userId);

    if (!user) {
      return errorHandler(res, "No user exists with this ID.");
    }
    var data = await LoanAccount.find({ userId: userId });

    return successHandler(res, data);
  } catch (err) {
    return errorHandler(res, err.message);
  }
});

//Function to create a new loan account
router.post("/", async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return errorHandler(res, error.details[0].message);
  }

  if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
    return errorHandler(res, "Invalid User Identity");
  }

  if (req.body.monthlySalary * 50 < req.body.totalLoanAmount) {
    return res.status(406).send({
      success: false,
      message: "You can not apply for loan of this amount.",
      applicableAmount: req.body.monthlySalary * 50,
    });
  }

  try {
    var account = new LoanAccount({
      userId: req.body.userId,
      monthlySalary: req.body.monthlySalary,
      totalLoanAmount: req.body.totalLoanAmount,
      tenureInYears: req.body.tenureInYears,
      addressOfProperty: req.body.addressOfProperty,
    });

    var user = await User.findById(account.userId, {
      accountNumber: 1,
      email: 1,
      _id: 1,
    });
    if (!user) return errorHandler(res, "User not found");

    account = await account.save();

    const p = account.totalLoanAmount;
    //* Per Month Calculation
    const r = 12 / 12 / 100;
    const t = account.tenureInYears * 12;

    const emi = calculateEmi(p, r, t);
    console.log(p, r, t, emi);

    let { listData } = getScheduleList(p, r, 1, t, emi);

    var schedule = new Schedule({
      loanId: account._id,
      userId: req.body.userId,
      emi: emi,
      tenureInYears: account.tenureInYears,
      principal: account.totalLoanAmount,
      outstandingAmount: account.totalLoanAmount,
      schedule: listData,
    });

    schedule = await schedule.save();

    return res.status(200).send({
      success: true,
      user: user,
      data: account,
      schedule: schedule,
    });
  } catch (err) {
    return errorHandler(res, err.message);
  }
});

//* Pay loan
router.post("/pay/:accountId", async (req, res) => {
  var accountId = req.params.accountId;
  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return errorHandler(res, "Invalid ID Provided");
  }

  try {
    let loanAccount = await Schedule.findOne({ loanId: accountId });
    if (!loanAccount) return errorHandler(res, "Account not found");

    var user = await User.findById(loanAccount.userId);

    if (!user)
      return errorHandler(res, "Did not find the user linked to the account");

    //TODO: Set the next month to active

    var { schedule, currentMonth } = loanAccount;

    schedule[currentMonth].status = "completed";
    currentMonth = currentMonth + 1;
    schedule[currentMonth].status = "active";

    loanAccount.schedule = schedule;
    loanAccount.currentMonth = currentMonth;

    //TODO: Deduct amount from user account
    user.accountBalance -= loanAccount.emi;

    await user.save();
    await loanAccount.save();

    return res.status(200).send({
      success: true,
      message: "EMI was successfully payed.",
    });
  } catch (err) {
    return res.status(401).send(err.message);
  }
});

//Function to foreclose the loan account with the specified accountId
router.post("/foreclose/:accountId", async (req, res) => {
  var accountId = req.params.accountId;
  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return res.status(404).send("Invalid ID Provided");
  }

  let loanAccount = await Schedule.findOne({ loanId: accountId });
  if (!loanAccount) return res.status(404).send("Account not found");

  if (loanAccount.status === "completed")
    return res.status(200).send({
      success: true,
      data: loanAccount,
      message: "This Loan is already completed.",
    });

  var user = await User.findById(loanAccount.userId);

  if (!user)
    return res.status(404).send({
      success: false,
      message: "Did not find the user linked to the account",
    });

  if (user.accountBalance < loanAccount.outstandingAmount) {
    return res.status(404).send({
      success: false,
      message: "You do not have sufficient balance to foreclose this loan.",
      requiredAmount: loanAccount.outstandingAmount,
    });
  }

  if (loanAccount.currentMonth < 3) {
    return res.status(400).send({
      success: false,
      message:
        "Loan can only be foreclosed once you have paid the EMI for atleast 3 months.",
    });
  }

  user.accountBalance = user.accountBalance - loanAccount.outstandingAmount;

  user = await user.save();

  loanAccount.outstandingAmount = 0;
  loanAccount.status = "completed";
  loanAccount.schedule = [];

  loanAccount = await loanAccount.save();

  return res.send({
    success: true,
    message: "Successfully foreclosed the loan account",
    user: user,
    loanAccount: loanAccount,
  });
});

router.post("/prepay", async (req, res) => {
  const loanId = req.query.loanId;
  var payingAmount = req.query.payingAmount;

  if (!mongoose.Types.ObjectId.isValid(loanId)) {
    return res.status(400).send("Invalid loanId");
  }

  var schedule = await Schedule.findOne({ loanId: loanId });
  if (!schedule) {
    return res.status(400).send("No Loan Exists with this Id");
  }

  if (payingAmount < schedule.emi * 3) {
    return res.status(400).send({
      success: false,
      message: "Prepayment amount must be greater than 3 times the monthly EMI",
      minimumPayableAmount: Math.round(schedule.emi * 3),
      loanId: loanId,
    });
  }

  var user = await User.findOne({ _id: schedule.userId });
  if (!user) {
    return res.status(400).send("User not found");
  }

  var { currentMonth, outstandingAmount } = schedule;

  schedule.schedule[currentMonth - 1].status = "Completed";
  var payableAmount = schedule.schedule[currentMonth - 1].payableAmount;

  outstandingAmount = outstandingAmount - payableAmount;
  payingAmount -= payableAmount;

  // Susbtract the extra amount provided for prepayment
  outstandingAmount -= payingAmount;

  console.log(
    outstandingAmount,
    schedule.rate / 12 / 100,
    schedule.tenureInYears * 12 - currentMonth
  );

  var rate = schedule.rate / 12 / 100;
  var newEmi = calculateEmi(
    outstandingAmount,
    rate,
    schedule.tenureInYears * 12 - currentMonth
  );

  const { listData, totalNonInterestAmount } = getScheduleList(
    outstandingAmount,
    rate,
    currentMonth + 1,
    schedule.tenureInYears * 12,
    newEmi
  );
  console.log("loans.js : ", totalNonInterestAmount);
  var newScheduleList = [
    ...schedule.schedule.slice(0, currentMonth),
    ...listData,
  ];

  outstandingAmount = totalNonInterestAmount;

  schedule.schedule = newScheduleList;
  schedule.currentMonth = schedule.currentMonth + 1;
  schedule.outstandingAmount = outstandingAmount;

  await schedule.save();

  return res.send(schedule);
});

module.exports = router;
