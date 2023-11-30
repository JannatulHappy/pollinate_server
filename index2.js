const express = require("express");
require("dotenv").config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// const nodemailer = require('nodemailer');
const morgan = require("morgan");
const port = process.env.PORT || 9000;

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
// const User = require("./src/models/user");
// const Payment = require("./src/models/payment");
// const Survey = require(".s/rc/models/survey");

const app = express();
// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://pollinate-01.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
// middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlf4d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// const connectDB = async () => {
//   console.log("connecting to database");
//   const mongoURI = getConnectionString();

//   await mongoose.connect(mongoURI, { dbName: process.env.DB_NAME });
//   console.log("connected to database");
// };
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("pollinateDb").collection("users");
    const paymentsCollection = client.db("pollinateDb").collection("payments");
    const surveysCollection = client.db("pollinateDb").collection("surveys");
    // role verification middlewares
    // for admins
    const verifyAdmin = async (req, res, next) => {
      const user = req.user;
      console.log("user from verify admin", user);
      const query = { email: user?.email };
      const result = await usersCollection.findOne(query);
      if (!result || result?.role != "admin") {
        return res.status(401).send({ message: "unauthorized access" });
      }
      next();
    };
    // for surveyor
    const verifySurveyor = async (req, res, next) => {
      const user = req.user;
      const query = { email: user?.email };
      const result = await usersCollection.findOne(query);
      if (!result || result?.role != "surveyor") {
        return res.status(401).send({ message: "unauthorized access" });
      }
      next();
    };
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
    
    // Save or modify user email, status in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      console.log("User found?----->", isExist);
      if (isExist) {
        if (user?.status == "Requested") {
          const result = await usersCollection.updateOne(
            query,
            {
              $set: {
                email: email,
                status: user?.status,
              },
            },
            options
          );
          return res.send(result);
        } else {
          return res.send(isExist);
        }
      }
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      );
      res.send(result);
    });
    // // update pro user status to pro-user
    // app.put("/user/status/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const status = req.body.status;
    //   const query = {
    //     email: email,
    //   };
    //   const updateDoc = {
    //     $set: {
    //       role: status,
    //     },
    //   };
    //   const result = await usersCollection.updateOne(query, updateDoc);
    //   res.send(result);
    // });
    // update user role
    // in admin
    app.put("/users/update/:email", verifyToken, async (req, res) => {
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
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // get all user
    // todo:verify admin

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // get specific user
    // why?
    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email: email });
      res.send(result);
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
    // save payment info in payment collection
    app.post("/payments", verifyToken, async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      // todo: send email to booking owner
      res.send(result);
    });
    // get all payments
    // in admin
    app.get("/payments", verifyToken, async (req, res) => {
      const result = await paymentsCollection.find().toArray();
      res.send(result);
    });
    // ------survey related api-------
    // post survey from surveyor dashboard
    app.post("/survey", verifyToken, verifySurveyor, async (req, res) => {
      const survey = req.body;
      const surveyData = { ...survey, timestamp: Date.now() };
      console.log(surveyData);
      const result = surveysCollection.insertOne(survey);
      res.send(result);
    });
    // get all survey
    app.get("/surveys", async (req, res) => {
      const result = await surveysCollection.find().toArray();
      res.send(result);
    });
    // get single survey
    app.get("/surveys/:id", async (req, res) => {
      const id = req.params.id;
      const result = await surveysCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // update specific surveys after vote
    app.put("/surveys/update/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(id, data);
      const filter = {
        _id: new ObjectId(id),
      };
      const options = { upsert: true };
      const updatedData = {
        $set: {
          like: data.like,
          dislike: data.dislike,
          totalVote: data.totalVote,
          Feedback: data.Feedback,
          responses: data.responses,
        },
      };

      const result = await surveysCollection.updateOne(
        filter,
        updatedData,
        options
      );
      console.log(result);
      res.send(result);
    });

    // // update surveys after surveyor update it from survey list
    app.put(
      "/surveys/surveyorList/:id",
      verifyToken,

      async (req, res) => {
        const id = req.params.id;
        const data = req.body;

        const filter = {
          _id: new ObjectId(id),
        };

        const updatedData = {
          $set: {
            category: data.category,
            title: data.title,
            description: data.description,
            image: data.image,
          },
        };

        const result = await surveysCollection.updateOne(filter, updatedData);
        console.log(result);
        res.send(result);
      }
    );
    // // update surveys status after admin change the survey status
    app.patch(
      "/surveys/status/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const data = req.body;
        console.log("new status", id, data);
        const filter = {
          _id: new ObjectId(id),
        };
        const options = { upsert: true };
        const updatedData = {
          $set: {
            surveyStatus: data.surveyStatus,
            adminFeedback: data.adminFeedback,
          },
        };

        const result = await surveysCollection.updateOne(
          filter,
          updatedData,
          options
        );
        console.log(result);
        res.send(result);
      }
    );
    // get specific surveyor survey
    // : verify host here
    app.get(
      "/surveyor-survey/:email",
      verifyToken,
      verifySurveyor,
      async (req, res) => {
        const email = req.params.email;
        const result = await surveysCollection
          .find({
            surveyCreatorEmail: email,
          })
          .toArray();
        res.send(result);
      }
    );
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Pollinate Server to vercel..");
});

app.listen(port, () => {
  console.log(`Pollinate Server is running on port ${port}`);
});
