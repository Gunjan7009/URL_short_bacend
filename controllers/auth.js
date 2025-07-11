const jwt = require('jsonwebtoken');
const User = require('../MODELS/user');
require('dotenv').config();

const registerUser = async (req, res) => {
    console.log('Received registration request:', req.body);
    const { name, email, mobile, password, confirmpassword } = req.body;
    
    if (!name || !email || !mobile || !password || !confirmpassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }
  
    if (password !== confirmpassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    
    try {
        const user = await User.create({ name, email, mobile, password, confirmpassword });
        await user.save();
        res.status(201).json({ message: "User registered." });
    } catch (err) {
        console.log('Error in registration:', err);
        if (err.code === 'EAUTH') {
            res.status(500).json({ err: 'Email authentication failed. Please contact support.' });
        } else {
            res.status(500).json({ err: 'An error occurred during registration', details: err.message });
        }
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });
        console.log('Hashed password in DB:', user.password);

        const isMatch = await user.comparePassword(password); // plain text password from login

      
        if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });


        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
        user.token = token;
        await user.save();
    
        res.json({
            token: token,
            user: { _id: user._id, email: user.email },
            isLoggedIn: true,
          });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};


const getMe = async (req, res) => {
    try {
        const email = req.user.email; // Get email from auth middleware

        // Fetch full user details from the database
        const user = await User.findOne({ email }).select("-password"); // Exclude password

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user); // Send full user data
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


const logoutUser = async (req, res) => {
    try {
        // Clear the JWT token from the cookie
        res.clearCookie('jwtToken');

        // Return a success response
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateUser = async (req, res) => {
    const { name, email, mobile } = req.body;
  
    try {
      const user = await User.findById(req.user.id);
      console.log("User found:", user);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
   
      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (mobile) user.mobile = mobile;


      console.log("before :", user);
      await user.save();
      console.log("after :", user);
      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
      });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  const deleteUser = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

     if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Delete the user
        await User.findByIdAndDelete(req.user.id);

        // Clear the JWT token from cookies or local storage if applicable
        res.clearCookie('jwtToken'); // Assuming JWT token is stored in cookies

        // Send success response with a message
        res.status(200).json({
            success: true,
            message: "User account deleted successfully. Redirecting to registration page...",
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUser,
    getMe,
    logoutUser,
    deleteUser,
};
