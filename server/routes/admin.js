const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET, authenticateJwt } = require("../middleware/auth");
const { Admin, Course } = require("../database/models");
const z = require("zod");

const router = express.Router();

let entryProps = z.object({
  username: z.string().min(1).max(50).email(),
  password: z.string().min(8).max(50),
});

router.post("/signup", (req, res) => {
  const parsedInput = entryProps.safeParse(req.body);
  if (!parsedInput.success) {
    res.status(411).json({ message: parsedInput.error.issues[0].message });
    return;
  }
  function callback(admin) {
    if (admin) {
      res.status(403).json({ message: "Admin already exists" });
    } else {
      const obj = {
        username: parsedInput.data.username,
        password: parsedInput.data.password,
      };
      const newAdmin = new Admin(obj);
      newAdmin.save();
      const token = jwt.sign({ username, role: "admin" }, SECRET, {
        expiresIn: "1h",
      });
      res.json({ message: "Admin created successfully", token });
    }
  }
  const username = parsedInput.data.username;
  Admin.findOne({ username }).then(callback);
});

router.get("/me", authenticateJwt, (req, res) => {
  res.json(req.user.username);
});

router.post("/login", async (req, res) => {
  const parsedInput = entryProps.safeParse(req.body);
  if (!parsedInput.success) {
    res.status(411).json({ message: parsedInput.error.issues[0].message });
    return;
  }
  const username = parsedInput.data.username;
  const password = parsedInput.data.password;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    const token = jwt.sign({ username, role: "admin" }, SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }
});

router.post("/courses", authenticateJwt, async (req, res) => {
  const course = new Course(req.body);
  await course.save();
  res.json({ message: "Course created successfully", courseId: course.id });
});

router.get("/courses/:courseId", authenticateJwt, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  res.json({ course });
});

router.put("/courses/:courseId", authenticateJwt, async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
  });
  if (course) {
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

router.delete("/courses/:courseId", authenticateJwt, async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.courseId, req.body, {
    new: true,
  });
  if (course) {
    res.json({ message: "Course deleted successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

router.get("/courses", authenticateJwt, async (req, res) => {
  const courses = await Course.find({});
  res.json({ courses });
});

module.exports = router;
