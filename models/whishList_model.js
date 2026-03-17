const whishListSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    recipe:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Recipe"
    }
},{timeStamps: true});

module.exports = mongoose.model("WishList",whishListSchema);