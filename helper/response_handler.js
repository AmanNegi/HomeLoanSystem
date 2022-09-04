function errorHandler(res, message) {
  return res.status(400).send({ success: false, message: message });
}

function successHandler(res, data) {
  return res.status(200).send({ success: true, data: data });
}

module.exports = { errorHandler, successHandler };
// module.exports = successHandler;
