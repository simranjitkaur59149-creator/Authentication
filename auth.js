import express from "express";
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = 8000;
const saltRound = 12;
app.use(express.json());
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected"))
  .catch((err) => console.log(err));
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, match: /.+\@.+\..+/, unique: true },
  password: String,
  created: { type: Date, default: Date.now() },
  updated: { type: Date, default: Date.now() },
});
userSchema.pre("updateOne", (next) => {
  console.log("running");
  this.set({ updated: Date.now() });
  next();
});
const User = mongoose.model("User", userSchema);
app.post("/addusers", async (req, res) => {
  try {
    const password = req.body.password;
    const hashpassword = await bcrypt.hash(password, saltRound);
    req.body.password = hashpassword;
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const user = await User.find().skip(skip).limit(limit);
    const userData = user.map((data) => {
      return {
        name: data.name,
        email: data.email,
        created: data.created,
        updated: data.updated,
      };
    });
    const totalusers = await User.countDocuments();
    const totalPages = Math.ceil(totalusers / limit);
    res
      .status(200)
      .json({ userData, totalusers, totalPages, currentPage: page });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
