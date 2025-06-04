    import express from "express";
    import jwt from "jsonwebtoken";
    import z from "zod";
    import bcrypt from "bcrypt";
    import { UserModel,ContentModel,LinkModel } from "./db";
    import { connectDB } from "./db";
    import {protect} from "./middleware"
    import { random } from "./utils";
    import dotenv from "dotenv";
    dotenv.config();

    const app = express();
    app.use(express.json());
    connectDB();

    const PORT = 3000;

    app.post("/api/v1/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const schema = z.object({
        username: z
            .string()
            .min(3, { message: "Username must be at least 3 characters long" })
            .max(20, { message: "Username must be at most 20 characters long" })
            .regex(/^[a-zA-Z0-9_]+$/, {
            message:
                "Username can only contain letters, numbers, and underscores",
            }),

        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(100)
            .regex(/[a-z]/, {
            message: "Password must contain at least one lowercase letter",
            })
            .regex(/[A-Z]/, {
            message: "Password must contain at least one uppercase letter",
            })
            .regex(/[0-9]/, {
            message: "Password must contain at least one number",
            })
            .regex(/[^a-zA-Z0-9]/, {
            message: "Password must contain at least one special character",
            }),
        });

        const result = schema.safeParse({
        username,
        password,
        });

        if (!result.success) {
        res.status(401).json({
            message: result.error.issues,
        });
        return;
        }
        const user = await UserModel.findOne({ username });
        if (user) {
        res.status(411).json({
            message: "username already exists",
        });
        return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({
        username,
        password: hashedPassword,
        });
        res.status(200).json({
        message: "User signed up",
        });
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json({
        message: "Something went wrong",
        });
        return;
    }
    });

    app.post("/api/v1/signin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await UserModel.findOne({ username });
        if (!user) {
        res.status(404).json({
            message: "User does not exist. Please sign up",
        });
        return;
        }
        const isPasswordValid = await bcrypt.compare(
        password,
        user.password as string
        );
        if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
        }

        const payload = {
        id: user._id,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "24h",
        });

        res.status(200).json({
        message: "Signin successful",
        token,
        });
    } catch (error) {
        res.status(500).json({
        message: "Something went wrong",
        });
        return;
    }
    });

    app.post("/api/v1/content", protect,async(req, res) => {
        //@ts-ignore
        const userId=req.userId;
        try{
            const {link,title,type}=req.body;
            if(!link || !title || !type){
                res.status(400).json({
                    message:"Please fill required fields"
                })
            }
            await ContentModel.create({
                link,
                title,
                type,
                userId,
                tags:[]
            })
            res.status(200).json({
                success:true,
                message:"content created successfully"
            })
        }catch(error){
            res.status(500).json({
                message:"Something went wrong"
            })
        }
    });

    app.get("/api/v1/content", protect,async(req, res) => {
        try{
            //@ts-ignore
            const userId=req.userId;
            const contents=await ContentModel.find({userId:userId}).populate("userId")
            if(contents.length===0){
                res.status(400).json({
                    message:"No content found"
                })
                return;
            }
            res.status(200).json({
                message:"content feteched successfully",
                data:contents
            })
            return;
        }catch(error){
            res.status(500).json({
                message:"something went wrong"
            })
        }
    });

    app.delete("/api/v1/content",protect, async(req, res) => {
        try{
            //@ts-ignore
            const userId=req.userId;    
            const contentId=req.body;
            if(!contentId){
                res.status(400).json({
                    message:"Content Id is required"
                })
                return;
            }
            await ContentModel.deleteMany({
                contentId,
                userId:userId
            })
            res.status(200).json({
                message:"content deleted successfully"
            })

        }catch(error){
            res.status(500).json({
                message:"Soething went wrong"
            })
        }
        
    });

    app.post("/api/v1/brain/share",protect, async(req, res) => {
        try{
            const {share}=req.body;
            let hash=random(10);
            if(share){
                const existingLink=await LinkModel.findOne({
                    //@ts-ignore
                    userId:req.userId
                })
                if(existingLink){
                    res.status(200).json({
                        message:"Your previous link",
                        hash:existingLink.hash
                    })
                    return;
                }
                await LinkModel.create({
                    //  @ts-ignore
                    userId:req.userId,
                    hash:hash
                })
                res.status(200).json({
                    message:"Link created",
                    hash:hash
                })
            }else{
                await LinkModel.deleteOne({
                //  @ts-ignore
                    userId:req.userId
                })
                res.status(200).json({
                    message:"Removed Link"
                })
            }

        }catch(error){
            res.status(500).json({
                success:false,
                message:"something went wrong"
            })
        }
    });

    app.get("/api/v1/brain/:shareLink", async(req, res) => {
        //  @ts-ignore
        const hash=req.params.shareLink;
        const link=await LinkModel.findOne({
            hash
        })
        if(!link){
            res.status(400).json({
                message:"Link not found"
            })
            return;
        }
        const content=await ContentModel.find({
            userId:link.userId
        })
        const user=await UserModel.findById(link.userId);
        res.status(200).json({
            success:true,
            username:user?._id,
            content:content

        })
    });

    app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
    });
