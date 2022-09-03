function calculateEmi(p, r, t) {
  var emi = (p * r * Math.pow(1 + r, t)) / (Math.pow(1 + r, t) - 1);

  return emi;
}

// Generates the Schedule List
function getScheduleList(p, r, start, end, emi) {
  let listData = [];
  let outstandingAmount = p;

  var totalIntrest = 0;
  var totalNonInterestAmount = 0;

  for (var i = start; i <= end; i++) {
    var intrest = outstandingAmount * r;

    totalIntrest = totalIntrest + intrest;
    totalNonInterestAmount = totalNonInterestAmount + (emi - intrest);

    outstandingAmount = outstandingAmount - (emi - intrest);

    listData.push({
      month: i,
      outstandingAmount: Math.round(outstandingAmount),
      intrestAmount: Math.round(intrest),
      status: i == start ? "active" : "pending",
      payableAmount: Math.round(emi),
    });
  }

  totalNonInterestAmount = Math.round(totalNonInterestAmount);

  return {
    listData,
    totalNonInterestAmount,
  };
}

module.exports = {
  calculateEmi,
  getScheduleList,
};
