function adminAuth(req,res,next){
    if(req.session.adminId){
        next()
    }else{
        res.redirect("/admin/login")
    }
}

module.exports = adminAuth