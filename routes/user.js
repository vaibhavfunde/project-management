import express from "express";
import authenticateUser from "../middleware/auth-middleware.js";
// import {
//   changePassword,
//   getUserProfile,
//   updateUserProfile,
// } from "../controllers/user.js";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { changePassword, createOrder, getUserProfile, sendVerificationEmail, toggleTwoFactorAuth, updateUserProfile, verifyPayment } from "../controller/user.js";


const router = express.Router();

// router.post("/verify",
//   validateRequest({
//     body: z.object({
//       name: z.string(),
//       profilePicture: z.string().optional(),
//     }),
//   }),
//    sendVerificationEmail);

// router.get("/verify",
//    validateRequest({
//      body: z.object({
//          code
//      }),
//    })
 
//    sendVerificationEmail);

router.post(
  "/verify",
  validateRequest({
    body: z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }),
  }),
  sendVerificationEmail // <-- correct handler function
);


router.get("/profile", authenticateUser, getUserProfile);
router.put(
  "/profile",
  authenticateUser,
  validateRequest({
    body: z.object({
      name: z.string(),
      profilePicture: z.string().optional(),
    }),
  }),
  updateUserProfile
);

router.put(
  "/change-password",
  authenticateUser,
  validateRequest({
    body: z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    }),
  }),
  changePassword
);


router.put('/toggle-2fa', toggleTwoFactorAuth);
router.post(
  "/create-order",
  // optional but recommended
  validateRequest({
    body: z.object({
      amount: z.number().positive(),
    }),
  }),
  createOrder
);

router.post(
  "/verify-payment",
   // optional but recommended
  validateRequest({
    body: z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }),
  }),
  verifyPayment
);


export default router;
