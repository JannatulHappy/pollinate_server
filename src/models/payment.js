const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  proUsername: String,
  proUserEmail: String,
  proUserImage: String,
  price: Number,
  transactionId: String,
  date: Date,
});

const Payment = mongoose.model("Payment", paymentSchema, "payments");

module.exports = Payment;
