// import mongoose, { Schema } from "mongoose";

// const userSchema = new Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     password: { type: String, required: true, select: false },
//     name: { type: String, required: true, trim: true },
//     profilePicture: { type: String },
//     isEmailVerified: { type: Boolean, default: false },
//     lastLogin: { type: Date },
//     is2FAEnabled: { type: Boolean, default: false },
//     twoFAOtp: { type: String, select: false },
//     twoFAOtpExpires: { type: Date, select: false },
//   },
//   { timestamps: true }
// );
// const User = mongoose.model("User", userSchema);

// export default User;


import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String },

    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },

    is2FAEnabled: { type: Boolean, default: false },
    twoFAOtp: { type: String, select: false },
    twoFAOtpExpires: { type: Date, select: false },

    // ✅ SUBSCRIPTION FIELDS
    subscriptionPlan: {
      type: String,
      enum: ["Basic", "Pro", "Enterprise"],
      default: "Basic",
    },

    subscriptionStatus: {
      type: String,
      enum: ["Active", "Inactive", "Cancelled"],
      default: "Inactive",
    },

    subscriptionStartDate: {
      type: Date,
    },

    paymentId: {
      type: String,
    },
    subscriptionExpiryDate: Date,
    subscriptionReminderSent: {     // ✅ OPTIONAL but useful
  type: Boolean,
  default: false,
},
  },
  
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
