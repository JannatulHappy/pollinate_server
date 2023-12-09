const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  category: String,
  title: String,
  description: String,
  like: { type: Number, default: 0 },
  dislike: { type: Number, default: 0 },
  report: { type: Number, default: 0 },
  image: String,
  timestamp: { type: Date, default: Date.now },
  surveyStatus: { type: String, default: "pending" },
  totalVote: { type: Number, default: 0 },
  surveyCreatedBy: String,
  surveyCreatorEmail: String,
  surveyCreatorImage: String,
  questions: [Object],

  Feedback: {
    type: [
      {
        proUserName: String,
        proUserEmail: String,
        proUserImage: String,
        comment: String,
      },
    ],
    default: [], // Set the default value to an empty array
  },

  responses: [
    {
      responseUserEmail: String,
      answers: {
        question1: String,
        question2: String,
        question3: String,
      },
      default: [],
    },
  ],
  adminFeedback: { type: String, default: "" },
});

const Survey = mongoose.model("Survey", surveySchema);

module.exports = Survey;
