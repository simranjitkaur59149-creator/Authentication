import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = 8000;
app.use(express.json());
//establish connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected"))
  .catch((err) => console.log(err));
//schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ ,unique:true},

});
//Model compiled from schema
const User = mongoose.model("User", userSchema);
//CRUD operations
//create users
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
//get all users
app.get("/users", async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1 //by default page=1
    const limit=parseInt(req.query.limit)||4 //by default limit=4
    const skip=(page-1)*limit
    const totalUsers= await User.countDocuments()
    const user = await User.find().skip(skip).limit(limit);
    res.status(200).json({totalUsers,totalPages:Math.ceil(totalUsers/limit),currentpage:page,user});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
//get one user by id
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: "Invaild ID" });
  }
});
//update one user by id
app.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
