var express = require('express');
var router = express.Router();
var Admin = require('../models/admin_model')

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

module.exports = router;