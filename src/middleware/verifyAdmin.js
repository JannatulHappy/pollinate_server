// for admins

const User = require("../models/user");

const verifyAdmin = async (req, res, next) => {
  const user = req.user;
  console.log("user from verify admin", user);
  try {
    const result = await User.findOne({ email: user?.email });
    if (!result || result?.role !== "admin") {
      return res.status(401).send({ message: "unauthorized access" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "internal server error" });
  }
};
module.exports = verifyAdmin;
