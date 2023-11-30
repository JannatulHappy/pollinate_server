const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const router = express.Router();
const port = process.env.PORT || 9000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const verifyToken = require("./src/middleware/verifyToken");
const verifyAdmin = require("./src/middleware/verifyAdmin");
const verifySurveyor = require("./src/middleware/verifySurveyor");
const Payment = require("./src/models/payment");
const User = require("./src/models/user");
const Survey = require("./src/models/survey");
const app = express();
// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "https://pollinate-01.web.app"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(morgan("dev"));

// MongoDB connection setup
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "";
    const dbName = process.env.DB_NAME || "pollinateDb";
    if (!mongoURI) {
      throw new Error("MongoDB connection string not provided");
    }
    await mongoose.connect(mongoURI, {
      dbName,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlf4d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// -------auth related api---------
app.post("/jwt", async (req, res) => {
  const user = req.body;
  console.log("I need a new jwt", user);
  const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
    expiresIn: "365d",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});
// Logout
app.get("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
    console.log("Logout successful");
  } catch (err) {
    res.status(500).send(err);
  }
});
// -----payment related-----
// payment intent-generate client secret for stripe payment
app.post("/create-payment-intent", verifyToken, async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  console.log(amount, "amount inside the intent");
  if (!price || amount < 1) return;

  const { client_secret } = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });

  res.send({
    clientSecret: client_secret,
  });
});
// Save payment info using Mongoose
router.post("/payments", verifyToken, async (req, res) => {
  try {
    const paymentData = req.body;
    const createdPayment = await Payment.create(paymentData);

    res.json(createdPayment);
  } catch (error) {
    console.error("Error saving payment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint
// verify admin hereto:to:do:-------
router.get("/payments", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const data = await Payment.find().exec();
    // console.log(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// users api end point--
// Save or modify status requested user email, status in DB using Mongoose
router.put("/users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;

    const query = { email: email };
    const options = { upsert: true };

    const isExist = await User.findOne(query);
    console.log("User found?----->", isExist);

    if (isExist) {
      if (user?.status === "Requested") {
        const result = await User.updateOne(
          query,
          {
            $set: {
              email: email,
              status: user?.status,
            },
          },
          options
        );
        return res.json(result);
      } else {
        return res.json(isExist);
      }
    }

    const result = await User.updateOne(
      query,
      {
        $set: { ...user, timestamp: Date.now() },
      },
      options
    );

    res.json(result);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// get all user
// todo:verify admin
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const result = await User.find().exec();
  res.send(result);
});

// update user role
router.put("/users/update/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;
    console.log(user);

    const query = { email: email };
    const updateDoc = {
      $set: {
        status: user.status,
        role: user.role,
      },
    };

    const result = await User.updateOne(query, updateDoc);

    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get specific user
// why?get user specific role?
router.get("/users/:email", verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    const result = await User.findOne({ email: email });

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ------survey related api-------
// post survey from surveyor dashboard
router.post("/survey", verifyToken, verifySurveyor, async (req, res) => {
  try {
    const survey = req.body;
    const surveyData = { ...survey, timestamp: Date.now() };

    console.log(surveyData);

    const result = await Survey.create(surveyData);

    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// get all survey
router.get("/surveys", async (req, res) => {
  try {
    const result = await Survey.find();
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// get single survey
router.get("/surveys/:id", async (req, res) => {
  console.log("API endpoint called");
  try {
    const id = req.params.id;
    // Use Mongoose's findById method
    const result = await Survey.findById(id);

    if (!result) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.send(result);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update specific survey after vote
router.put("/surveys/update/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const filter = { _id: id };
    const updatedData = {
      $set: {
        like: data.like,
        dislike: data.dislike,
        totalVote: data.totalVote,
        Feedback: data.Feedback,
        responses: data.responses,
      },
    };

    const result = await Survey.updateOne(filter, updatedData);
    console.log(result);

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: "Survey updated successfully" });
    } else {
      res.status(404).send({ success: false, message: "Survey not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});
// // update surveys after surveyor update it from survey list
// Update survey status after admin changes the survey status
router.patch(
  "/surveys/status/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    try {
      const filter = { _id: id };
      const updatedData = {
        $set: {
          surveyStatus: data.surveyStatus,
          adminFeedback: data.adminFeedback,
        },
      };

      const result = await Survey.updateOne(filter, updatedData);
      console.log(result);

      if (result.modifiedCount > 0) {
        res.send({
          success: true,
          message: "Survey status updated successfully",
        });
      } else {
        res.status(404).send({ success: false, message: "Survey not found" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  }
);
router.put(
  "/surveys/surveyorList/:id",
  verifyToken,
  verifySurveyor,
  async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    try {
      const filter = { _id: id };
      const updatedData = {
        $set: {
          category: data.category,
          title: data.title,
          description: data.description,
          image: data.image,
        },
      };

      const result = await Survey.updateOne(filter, updatedData);
      console.log(result);

      if (result.modifiedCount > 0) {
        res.send({ success: true, message: "Survey updated successfully" });
      } else {
        res.status(404).send({ success: false, message: "Survey not found" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  }
);
router.get(
  "/surveyor-survey/:email",
  verifyToken,
  verifySurveyor,
  async (req, res) => {
    const email = req.params.email;

    try {
      const result = await Survey.find({
        surveyCreatorEmail: email,
      }).exec();

      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  }
);

app.get("/", (req, res) => {
  res.send("Hello from Pollinate Server to vercel..");
});
app.use("/", router);
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
//   // Connect to MongoDB when the server starts
//   connectDB();
// });
const main = async () => {
  connectDB();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Connect to MongoDB when the server starts
    
  });
};
main()
