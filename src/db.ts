import mongoose,{model,Schema} from "mongoose"

export const connectDB=()=>{
    mongoose.connect('mongodb://localhost:27017/brainly')
    .then(()=>console.log("DB Connection done"))
    .catch(()=>console.log("DB connection failed"))
}

const userSchema=new Schema({
    username:{
        type:String,
        unique:true
    },
    password:String
})

const ContentSchema=new Schema({
    title:String,
    link:String,
    type:String,
    tags:[{
        type:mongoose.Types.ObjectId,
        ref:'Tag'
    }],
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    }
})

const TagSchema=new Schema({
    title:String
})

const LinkSchema=new Schema({
    hash:String,
    userId:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true,
        unique:true
    }
})



export const UserModel= model("User",userSchema);
export const ContentModel=model("Content",ContentSchema)
export const TagsModel=model("Tags",TagSchema);
export const LinkModel=model("Link",LinkSchema)