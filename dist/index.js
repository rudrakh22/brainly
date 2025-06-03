"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = __importDefault(require("zod"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("./db");
const db_2 = require("./db");
const middleware_1 = require("./middleware");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, db_2.connectDB)();
const PORT = 3000;
app.post("/api/v1/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const schema = zod_1.default.object({
            username: zod_1.default
                .string()
                .min(3, { message: "Username must be at least 3 characters long" })
                .max(20, { message: "Username must be at most 20 characters long" })
                .regex(/^[a-zA-Z0-9_]+$/, {
                message: "Username can only contain letters, numbers, and underscores",
            }),
            password: zod_1.default
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
        const user = await db_1.UserModel.findOne({ username });
        if (user) {
            res.status(411).json({
                message: "username already exists",
            });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db_1.UserModel.create({
            username,
            password: hashedPassword,
        });
        res.status(200).json({
            message: "User signed up",
        });
        return;
    }
    catch (error) {
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
        const user = await db_1.UserModel.findOne({ username });
        if (!user) {
            res.status(404).json({
                message: "User does not exist. Please sign up",
            });
            return;
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }
        const payload = {
            id: user._id,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        res.status(200).json({
            message: "Signin successful",
            token,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Something went wrong",
        });
        return;
    }
});
app.post("/api/v1/content", middleware_1.protect, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    try {
        const { link, title } = req.body;
        await db_1.ContentModel.create({
            link,
            title,
            userId,
            tags: []
        });
        res.status(200).json({
            success: true,
            message: "content created successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});
app.get("/api/v1/content", middleware_1.protect, async (req, res) => {
    try {
        //@ts-ignore
        const userId = req.userId;
        const contents = await db_1.ContentModel.find({ userId: userId }).populate("userId");
        console.log("contents", contents);
        if (contents.length === 0) {
            res.status(400).json({
                message: "No content found"
            });
            return;
        }
        res.status(200).json({
            message: "content feteched successfully",
            data: contents
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "something went wrong"
        });
    }
});
app.delete("/api/v1/content", (req, res) => { });
app.post("/api/v1/brain/share", (req, res) => { });
app.get("/api/v1/brain/shareLink", (req, res) => { });
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
