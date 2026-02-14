
import { sendEmail } from "../libs/send-email.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
// import {sendEmail} from "../libs/send-email";
import Razorpay from "razorpay";
import crypto from "crypto";

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    delete user.password;

    // jfkd

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);

    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);

    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(403).json({ message: "Invalid old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);

    res.status(500).json({ message: "Server error" });
  }
};

 const toggleTwoFactorAuth = async (req, res) => {
  const userId = req.user.id; // from `authenticateUser` middleware
  const { enable } = req.body;



  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { is2FAEnabled: enable }, // ✅ match schema
      { new: true }
    ).select('-password');
     // exclude password

   

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(user.is2FAEnabled);

    return res.status(200).json({
      message: `2FA ${enable ? 'enabled' : 'disabled'}`,
      user,
    });
  } catch (err) {
    console.error('2FA toggle error:', err);
    return res.status(500).json({ error: 'Server error while toggling 2FA' });
  }
};

export const sendVerificationEmail = async (req, res) => {
  try {
    
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    console.log("Received email:", email);
    

    const user = await User.findOne({ email }).select("+emailVerificationCode +emailVerificationExpiry");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    await user.save();

    const emailSubject = "Verify your email address";
    const emailBody = `Your email verification code is: ${verificationCode}`;

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);

    if (!isEmailSent) {
      return res.status(500).json({ message: "Failed to send verification email." });
    }

    res.status(200).json({ message: "Verification code sent to your email." });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Server error." });
  }
};


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



// export const createOrder = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount || isNaN(amount) || amount <= 0) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     const order = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "receipt_" + Date.now(),
//     });

//     res.json(order);
//   } catch (err) {
//     console.error("Create order error:", err);
//     res.status(500).json({ error: "Order creation failed" });
//   }
// };


// ================= VERIFY PAYMENT =================



export const createOrder = async (req, res) => {
  try {
    const { amount, planName } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),

      // ✅ Store metadata
      notes: {
        planName,
        userId: req.user._id.toString(),
      },
    });

    res.json(order);

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

// export const verifyPayment = (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature === razorpay_signature) {
//       res.json({ success: true });
//     } else {
//       res.status(400).json({ success: false });
//     }
//   } catch (err) {
//     console.error("Verify payment error:", err);
//     res.status(500).json({ error: "Verification failed" });
//   }
// };


// export const verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       planName, // ✅ optional if sent from frontend
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         error: "Missing verification fields",
//       });
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false });
//     }

//     // ✅ Fetch Razorpay order (to read notes)
//     const order = await razorpay.orders.fetch(razorpay_order_id);

//     const finalPlan =
//       planName || order.notes.planName || "Basic";

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // ✅ SAVE SUBSCRIPTION
//     user.subscriptionPlan = finalPlan;
//     user.subscriptionStatus = "Active";
//     user.subscriptionStartDate = new Date();
//     user.paymentId = razorpay_payment_id;

//     await user.save();

//     // ✅ Send email
//     await sendEmail(
//       user.email,
//       "Subscription Activated 🎉",
//       `Hello ${user.name},

// Your ${finalPlan} plan is now active.

// Payment ID: ${razorpay_payment_id}
// `
//     );

//     res.json({ success: true });

//   } catch (err) {
//     console.error("🔥 Verify payment crash:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);

    const finalPlan = planName || order.notes.planName || "Basic";

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const startDate = new Date();

    const durationDays =  30;

    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + durationDays);

    // ✅ SAVE SUBSCRIPTION
    user.subscriptionPlan = finalPlan;
    user.subscriptionStatus = durationDays === 0 ? "Active" : "Active";
    user.subscriptionStartDate = startDate;
    user.subscriptionExpiryDate = durationDays === 0 ? null : expiryDate;
    user.subscriptionReminderSent = false;
    user.paymentId = razorpay_payment_id;

    await user.save();

    // ✅ Email (non-blocking)
    try {
      await sendEmail(
        user.email,
        "Subscription Activated 🎉",
        `Hello ${user.name},

Your ${finalPlan} plan is now active.
Expiry: ${
          user.subscriptionExpiryDate
            ? user.subscriptionExpiryDate.toDateString()
            : "Never"
        }

Payment ID: ${razorpay_payment_id}`
      );
    } catch (emailErr) {
      console.error("Email failed:", emailErr.message);
    }

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 Verify payment crash:", err);
    res.status(500).json({ error: err.message });
  }
};




export { getUserProfile, updateUserProfile, changePassword, toggleTwoFactorAuth };
