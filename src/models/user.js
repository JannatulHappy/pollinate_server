const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  status: String,
  timestamp: Number,
  userImage: String,
});

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
