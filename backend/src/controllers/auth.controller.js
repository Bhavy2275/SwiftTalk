import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendVerificationEmail } from "../lib/emailUtils.js";

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: otpExpires,
    });

    if (newUser) {
      // Send verification email
      const emailSent = await sendVerificationEmail(email, otp);
      
      if (!emailSent) {
        // If email fails, delete the user and return error
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ 
          message: "Failed to send verification email. Please try again later." 
        });
      }
      
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        isEmailVerified: newUser.isEmailVerified,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  console.log("Verification request received:", { email, otp });
  
  try {
    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      console.log("Email already verified");
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
      console.log("No verification request found");
      return res.status(400).json({ message: "No verification request found" });
    }

    if (user.emailVerificationOTPExpires < new Date()) {
      console.log("OTP expired");
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (user.emailVerificationOTP !== otp) {
      console.log("Invalid OTP");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    console.log("Verifying email...");
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpires = null;
    await user.save();

    console.log("Email verified successfully");
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpires;
    await user.save();

    await sendVerificationEmail(email, otp);

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.log("Error in resendVerificationEmail controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};