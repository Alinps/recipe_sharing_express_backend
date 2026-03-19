var express = require('express');
var router = express.Router();
var Admin = require('../models/admin_model');
var bcrypt = require('bcrypt');
var adminAuth = require('../middleware/adminAuth');
const User  = require('../models/user_model');
const Recipe = require('../models/recipe_model');

router.get("/create",async (req,res)=>{
try{
    const newUser = new Admin({
        "username":"alin",
        "email":"alinps@gmail.com",
        "password":"admin@123"
    });
    await newUser.save();
    
    return res.send('admin created')
}catch(error){
    console.log(error);
    return res.send("failed to create admin");
}
})

router.get("/login",(req,res)=>{
    res.render("admin/login",{
        error:null,title: "Admin Login",
        layout: "layout/auth-layout"});
})

router.post("/login",async (req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        const admin = await Admin.findOne({email});

        if(!admin){
            return res.render("admin/login",{error:"Invalid email"});
        }

        const isMatch = await password === admin.password

        if(!isMatch){
            return res.render("admin/login",{error:"Invalid password"});
        }

        req.session.adminId = admin._id;
        res.redirect("/admin/dashboard")

    }catch(error){
        console.log(error);
        res.render("/admin/login",{error:"something went wrong"})
    }
});


router.get("/dashboard", adminAuth, async (req,res)=>{
    try{
        const users = await User.find()
        .sort({createdAt:-1})
        res.render("admin/dashboard",{users});
    }catch(error){
        console.log(error);
        res.render("admin/dashboard",{error:"Something went wrong"})
    }
})

router.get("/recipelist/:id",adminAuth, async (req,res)=>{
    try{
        const userId = req.params.id
        const recipes = await  Recipe.find({createdBy:userId}).select("title createdAt id").sort({createdAt:-1});
        console.log(recipes)
        res.render("admin/recipe-list",{recipes,title:"User Recipes",error:null})
    }catch(error){
        console.log(error)
        res.render("admin/recipe-list",{error:"Something went wrong"})
    }
})

router.post("/toggleuser/:id", adminAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if(!user){
            return res.redirect("/admin/dashboard");
        }

        user.isActive = !user.isActive;
        await user.save();
        res.redirect("/admin/dashboard");
    } catch (error) {
        console.log(error);
        res.redirect("/admin/dashboard");
    }
});

router.get("/recipedetails/:id",adminAuth,async (req,res)=>{
    try{
        const recipeId = req.params.id
        const recipe = await Recipe.findById(recipeId)
        console.log(recipe.image)
        return res.render("admin/recipedetails",{recipe,error:null,title:"Recipe Details"})
    }catch(error){
        console.log(error);
        res.render("admin/recipedetails",{recipe:null,error:"something went wrong",                                                                                                                                                                                                                title:"Recipe Details"})
    }
})

module.exports = router;