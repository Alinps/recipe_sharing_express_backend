var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const Recipe = require('../models/recipe_model');
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");


// route for signup
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and Confirm Password do not match"
      });
    }

    const user = new User({ email, username, password });
    const validationError = user.validateSync();

    if (validationError) {
      return res.status(400).json({
        error: validationError.errors
      });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken"
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already taken"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
});



// api for login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




router.post("/create",authMiddleware, upload.single("image"), async (req,res)=>{
  try {
    const {
      title,
      description,
      ingredients,
      steps,
      cookingTime,
      difficulty
    } = req.body;

    if (!title || !description || !ingredients || !steps || !cookingTime || !difficulty){
      return res.status(400).json({
        "message":"All fields are required"
      });
    }

    const recipe = new Recipe({
      title,
      description,
      ingredients,
      steps,
      cookingTime,
      difficulty,
      image: req.file ? req.file.filename : null,
      createdBy: req.user.userId
    });
    await recipe.save();

    res.status(201).json({
      "message":"Recipe created successfully"
    })
  }catch (error){
    console.error(error);
    res.status(500).json({
      "message":"Internal Server Error"
    });
  }
});


router.get("/list",authMiddleware,async (req,res)=>{
  try {
    const recipes = await Recipe.find()
          .populate("createdBy","username email");
          res.status(200).json({
            success:true,
            count: recipes.length,
            data: recipes
          });
  } catch (error){
    res.status(500).json({
      success:false,
      message:"Failded to fetch recipes",
      error: error.message
    });
  }
})



module.exports = router;

