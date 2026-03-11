import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors"

dotenv.config();

const app = express();
const PORT = 8000;
const saltRound = 12;
app.use(cors());
app.use(express.json());

/* -------------------- MongoDB Connection -------------------- */

mongoose
  .connect(`${process.env.MONGO_URL}/authDb`)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* -------------------- Schema -------------------- */

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/,
    unique: true,
  },
  password: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

/* -------------------- Middleware -------------------- */

userSchema.pre("updateOne", function (next) {
  this.set({ updated: Date.now() });
  next();
});

const User = mongoose.model("User", userSchema);

/* -------------------- CREATE USER -------------------- */

app.post("/users", async (req, res) => {
  try {
    const password = req.body.password;

    const hashpassword = await bcrypt.hash(password, saltRound);
    req.body.password = hashpassword;

    const user = await User.create(req.body);

    res.status(201).json({
      message: "User Created",
      user,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- GET ALL USERS (Pagination) -------------------- */

app.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;

    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(limit);

    const userData = users.map((data) => ({
      id: data._id,
      name: data.name,
      email: data.email,
      created: data.created,
      updated: data.updated,
    }));

    const totalusers = await User.countDocuments();
    const totalPages = Math.ceil(totalusers / limit);

    res.status(200).json({
      userData,
      totalusers,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- GET SINGLE USER -------------------- */

app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- UPDATE USER -------------------- */

app.put("/users/:id", async (req, res) => {
  try {
    if (req.body.password) {
      const hashpassword = await bcrypt.hash(req.body.password, saltRound);
      req.body.password = hashpassword;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User Updated",
      user,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- DELETE USER -------------------- */

app.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User Deleted",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- SERVER -------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});