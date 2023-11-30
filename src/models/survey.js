const mongoose = require("mongoose");

// Define the Survey schema
const surveySchema = new mongoose.Schema({
  category: String,
  title: String,
  description: String,
  like: { type: Number, default: 0 },
  dislike: { type: Number, default: 0 },
  report: { type: Number, default: 0 },
  image: String,
  timestamp: { type: Date, default: Date.now },
  surveyStatus: String,
  totalVote: { type: Number, default: 0 },
  surveyCreatedBy: String,
  surveyCreatorEmail: String,
  surveyCreatorImage: String,
  questions: [
    {
      question1: String,
    },
    {
      question2: String,
    },
    {
      question3: String,
    },
  ],
  feedback: {
    type: [
      {
        proUserName: String,
        proUserEmail: String,
        proUserImage: String,
        comment: String,
      },
    ],
    default: [],
  },
  responses: {
    type: [
      {
        responseUserEmail: String,
        answers: { question1: String, question2: String, question3: String },
      },
    ],
    default: [],
  },
});

// Create the Survey model
const Survey = mongoose.model("Survey", surveySchema);

module.exports = Survey;
