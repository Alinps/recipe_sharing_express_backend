var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const Recipe = require('../models/recipe_model');
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require('fs');


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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(newPassword)){
      return res.status(400).json({
        "message":"Password must contain 8 characters, uppercase, lowercase, number and special character"
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
});

router.get("/profile/:id",authMiddleware,async (req,res)=>{
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("username email");

    if(!user){
      return res.status(404).json({
        "message":"User not found"
      });
    }

    const recipes = await Recipe.find({createdBy:userId}).select("title image createdAt");

    return res.status(200).json({
      user,
      recipes
    });
  }catch (error){
    return res.status(500).json({
      message:"Error fetching  profile",
      error: error.message
    });
  }

})


router.delete("/deletePost/:id",authMiddleware,async (req,res)=>{
  try {
    recipeId = req.params.id
    const recipe = await Recipe.findById(recipeId)

    if(!recipe){
      return res.status(404).json({
        "message":"Recipe not found"
      });
    }

    if (recipe.createdBy.toString() !== req.user.userId){
      return res.status(403).json({
        "message":"You are not allowed to delete this recipe"
      });
    }
    //deleting recipe
    await Recipe.findByIdAndDelete(recipeId);

    return res.status(200).json({
      "message":"Recipe deleted successfully"
    });

  }catch (error){
    return res.status(500).json({
      "message":"Error deleting recipe",
      "error":error.message
    });
  }
});




router.put("/updaterecipe/:id",authMiddleware,async (req,res)=>{
  try{
    const recipeId = req.params.id
    const recipe = await Recipe.findById(recipeId)

    if (!recipe){
      return res.status(404).json({
        "message":"Recipe not found"
      });
    }

    if (recipe.createdBy.toString() !== req.user.userId){
      return res.status(403).json({
        "message":"You are not allowed to edit this recipe"
      });
    }
    
    upload.single('image')(req,res,async(err)=>{
      if (err) {
        return res.status(500).json({"message":"file upload error"})
      }
      try{
        recipe.title = req.body.title || recipe.title;
        recipe.description = req.body.description || recipe.description;
        recipe.ingredients = req.body.ingredients || recipe.ingredients;
        recipe.steps = req.body.steps || recipe.steps;
        recipe.cookingTime = req.body.cookingTime || recipe.cookingTime;
        recipe.difficulty = req.body.difficulty || recipe.difficulty;
        recipe.image = req.file ? req.file.filename : null || recipe.image

        await recipe.save();

        return res.status(200).json({
          "message":"Recipe updated successfully"
        })
      }catch(error){
        if (req.file){
          fs.unlink(req.file.path,()=>{});
        }
        console.log(error);
        return  res.status(500).json({
              "message":"Error updating recipe",
               error:error.message
              });
      }
    })
    }catch(error){
      console.log(error)
      return res.status(500).json({
        "message":"Internal Server Error"
      });
    }
  })


router.put("/profileupdate",authMiddleware,async (res,req)=>{
  try{
    const userId = req.user.userId;
    const user = await User.findByID(userId);
    const newUsername = req.body.username
    
    if (!user){
      return res.status(404).json({
        "message":"User not found"
      })
    }
    const newExistingUser = await User.findOne({newUsername})

    if (newExistingUser){
      return res.status(403).json({
        "message":"Username already exists"
      })
    }
    user.username = newUsername
    await user.save()

    return res.status(200).json({
      "message":"Username updated successfully"
    })

  }catch (error){
    console.log(error)
    return res.status(500).json({
      "message":"username cannot be updated",
      "error":error.message
    });
  }
})


router.put("/changepassword",authMiddleware,async (req,res)=>{
  try{
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const newPassword = req.body.newPassword;
    const currentPassword = req.body.currentPassword
    const confirmPassword = req.body.confirmPassword

    if (!(newPassword && currentPassword && confirmPassword)){
      return res.status(400).json({
        "message":"All fields are required"
      })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if(!isMatch){
      return res.status(400).json({
        "message":"Old password is incorrect"
      })
    }

    if (newPassword !== confirmPassword){
      return res.status(400).json({
        "message":"Passwords do not match"
      })
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(newPassword)){
      return res.status(400).json({
        "message":"Password must contain 8 characters, uppercase, lowercase, number and special character"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword,10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      "message":"Password changed"
    });
    
  }catch(error){
    console.log(error);
    return res.status(500).json({
      "message":"Internal Server Error",
      "error": error.message
    });
  }
})


router.get("/search",authMiddleware,async (req,res)=>{
  try{
    const query = req.query.q;
    
    if (!query){
      return res.status(400).json({
        "message":"Search query is required"
    })
    }

    const recipes = await Recipe.find({
      $or : [
        {title: {$regex:query, $options:"i"}},
        {ingredients: {$regex:query, $options:"i"}},
        {difficulty: {$regex:query, $options:"i"}}
      ]
    })

    return res.status(200).json(recipes);
  }catch(error){
    res.status(500).json({
      "message":"Search failed",
      "error":error.message
    })
  }
})



module.exports = router;

