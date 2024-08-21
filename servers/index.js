require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/authMiddleware");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");  // Allow requests from your frontend origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token");  // Include x-access-token

  if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
  }
  
  next();
});


app.use(express.json());

// Register
app.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, username, password, department, position } = req.body;

    if (!(username && password && first_name && last_name && department && position)) {
      return res.status(400).send("All input is required");
    }

    const oldUser = await User.findOne({ username });

    if (oldUser) {
      return res.status(409).send("User already exists. Please login.");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      department,
      position,
      username: username.toLowerCase(),
      password: encryptedPassword,
    });

    const token = jwt.sign(
      { user_id: user._id, username },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

// Login
app.post("/login", async (req, res) => {
  console.log(req.body);
  try {
      const { username, password } = req.body;

      // แก้ไขข้อความในเงื่อนไขนี้
      if (!(username && password)) {
          return res.status(400).send("All input is required");
      }

      const user = await User.findOne({ username });

      if (user && (await bcrypt.compare(password, user.password))) {
          const token = jwt.sign(
              { user_id: user._id, username },
              process.env.TOKEN_KEY,
              {
                  expiresIn: "2h",
              }
          );
          user.token = token;

          return res.status(200).json(user);
      }

      return res.status(400).send("Invalid credentials");
  } catch (err) {
      console.log(err);
      return res.status(500).send("Internal Server Error");
  }
});


app.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id).select("first_name last_name");
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});


module.exports = app;
