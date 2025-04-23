import router from "./routes/question.route.js";
import userRouter from "./routes/user.route.js";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { notfound,errorHandler } from "./middlewares/error.js";
import ConnectDB from "./Db/index.js";

const PORT = process.env.PORT || 5003;
const app = express();

dotenv.config();
app.use(cors(
    {
        origin:"http://localhost:5173",
        credentials: true, // Allow cookies to be sent with requests
    }
));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));

app.use("/api/questions", router);
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
    res.send("Welcome to the Quiz API!");
});


app.use(notfound);
app.use(errorHandler);

// Connect to MongoDB
ConnectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error.message);
  });



