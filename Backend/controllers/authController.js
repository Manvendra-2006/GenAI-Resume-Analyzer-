import User from "../models/User.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import blacklistModel from "../models/blacklist.model.js"
import { sendRegistrationEmail } from "../services/email.service.js"
export async function SignUp(req,resp){
    try{
        const {name,email,password} = req.body
        if(!name||!email||!password){
            return resp.status(400).json({message:"All fields are required"})
        }
        const user = await User.findOne({$or:[{email},{name}]})
        if(user){
            return resp.status(400).json({message:"User is already present"})
        }
        const hashpassword = await bcrypt.hash(password,10)
        if(!hashpassword){
            return resp.status(404).json({message:"Hash Password is not generated"})
        }
        const newUser = await User.create({
            name,
            email,
            password:hashpassword
        })
        await sendRegistrationEmail(email,name)
        return resp.status(201).json({message:"User is created",newUser})
    }
    catch(error){
        return resp.status(500).json({message:"Internal server error",error})
    }
}
export async function Login(req,resp){
     try{
         const {email,password} = req.body
         if(!email||!password){
             return resp.status(400).json({message:"Please Provide email and password"})
        }
         const userExists = await User.findOne({email})
         if(!userExists){
             return resp.status(404).json({message:"User is not exist please signup"})
         }
         const match = await bcrypt.compare(password,userExists.password)
         if(!match){
             return resp.status(404).json({message:"Password is not matched"})
         }
         const token = await jwt.sign(
             {id:userExists._id,name:userExists.name},
             process.env.JWT_SECRET_KEY,
             {expiresIn:'1d'}
         )
         resp.cookie("token",token) // Yaha broswer main cookie save hogyi hain 
         return resp.status(201).json({message:"Login Successfully",token,user:{id:userExists._id,name:userExists.name,email:userExists.email}})
     }
     catch(error){
        return resp.status(500).json({message:"Internal Server Error",error})
     }
 }
 export async function logoutUserController(req,resp){
    try{
        const token = req.cookies.token
        if(token){
            await blacklistModel.create({token})
        }
        resp.clearCookie("token")
        return resp.status(200).json({message:"User Logged Out Successfully"})
    }
    catch(error){
      return resp.status(500).json({message:"Internal Server Error",error})
    }
 }
 export async function getMeController(req,resp){
    try{
        const user = await User.findById(req.user.id)
        return resp.status(200).json({message:"Data get",user:{id:user._id,username:user.name,email:user.email}})
    }
    catch(error){
        return resp.status(500).json({message:"Internal server error",error})
    }
 }