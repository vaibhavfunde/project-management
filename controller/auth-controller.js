import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.js";
import { sendEmail } from "../libs/send-email.js";
import aj from "../libs/arcjet.js";



const registeruser = async (req, res) => {

     
    try {
        const {email, password, name} = req.body;



        // const decision = await aj.protect(req, { email });
        // console.log("Arcjet decision", decision.isDenied());
        // console.log("Arcjet decision", decision);
    
        // if (decision.isDenied()) {
        //   res.writeHead(403, { "Content-Type": "application/json" });
        //   res.end(JSON.stringify({ message: "Invalid email address" }));
        // }

        // const decision = await aj.protect(req, {requested: 5  });
        const decision = await aj.protect(req, {  email,
            requested: 1,
         });


        console.log("Arcjet decision isDenied:", decision.isDenied());
        console.log("Arcjet full decision:", decision);
    
        // if (decision.isDenied()) {
        //   const message = decision.reason?.message || "Access denied by Arcjet";
        //   return res.status(403).json({ message });
        // }

        //  if (decision.isDenied()==true) {
        //   res.writeHead(403, { "Content-Type": "application/json" });
        //   res.end(JSON.stringify({ message: "Invalid email address" }));
        // }

        if (decision.isDenied()) {
            return res.status(403).json({ message: "Invalid email address" });
          }
          




        // Check if user already exists
        const existingUser = await User.findOne({
            email
        })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        } 

        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            email: email,
            password: hashedPassword,
            name: name,
        });
        console.log("New User:", newUser);
        await newUser.save();

        //to Do save email verification token and send email

         const verificationToken = jwt.sign(
            { userId: newUser._id , purpose:"email-verification" },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await Verification.create({
            userId: newUser._id,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
        });

        // send verification email
        // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        // const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`;
        // const emailSubject = "Verify your email";
//         const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

// const emailSubject = "Verify your Email Address";

// const emailBody = `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 8px; background-color: #ffffff;">
//     <h2 style="color: #333;">🔐 Verify Your Email</h2>

//     <p style="font-size: 14px; color: #555;">
//       Thank you for signing up! Please verify your email address by clicking the button below:
//     </p>

//     <a href="${verificationLink}" style="display: inline-block; margin-top: 16px; padding: 12px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">
//       Verify Email
//     </a>

//     <p style="font-size: 12px; color: #999; margin-top: 24px;">
//       If you didn’t create an account, you can ignore this email.
//     </p>
//   </div>
// `;

const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
const emailSubject = "Verify your Email Address";

const emailBody = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f7;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="text-align: center;">
                  <h1 style="margin-bottom: 16px; font-size: 24px; color: #333333;">Welcome to Our Platform!</h1>
                  <p style="font-size: 16px; color: #555555; margin-bottom: 24px;">
                    Hi there, <br /> Please verify your email address to complete your registration and start using your account.
                  </p>

                  <a href="${verificationLink}" target="_blank"
                    style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #007bff; border-radius: 4px; text-decoration: none;">
                    Verify Email
                  </a>

                  <p style="font-size: 14px; color: #888888; margin-top: 30px;">
                    If you didn’t request this, you can safely ignore this email.
                  </p>

                  <p style="font-size: 14px; color: #888888;">
                    Or copy and paste this link into your browser:<br />
                    <a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size: 12px; color: #999999; margin-top: 20px;">
              &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;



        const isEmailSend = await sendEmail(email, emailSubject, emailBody);

        res.status(201).json({ message: "Verification email sent to your email. Please check and verify your account " });

        if (!isEmailSend) {
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        
    } catch (error) {
        console.error("Error in registeruser:", error);
        res.status(500).json({ message: "Internal Server Error 2" });
    }
}

// const loginUser = async (req, res) => {
  
    

//         try {
//             const { email, password } = req.body;
        
//             const user = await User.findOne({ email }).select("+password");
        
//             if (!user) {
//               return res.status(400).json({ message: "Invalid email or password" });
//             }
        
//             if (!user.isEmailVerified) {
//               const existingVerification = await Verification.findOne({
//                 userId: user._id,
//               });
        
//               if (existingVerification && existingVerification.expiresAt > new Date()) {
//                 return res.status(400).json({
//                   message:
//                     "Email not verified. Please check your email for the verification link.",
//                 });
//               } else {
//                 await Verification.findByIdAndDelete(existingVerification._id);
        
//                 const verificationToken = jwt.sign(
//                   { userId: user._id, purpose: "email-verification" },
//                   process.env.JWT_SECRET,
//                   { expiresIn: "1h" }
//                 );
        
//                 await Verification.create({
//                   userId: user._id,
//                   token: verificationToken,
//                   expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
//                 });



//                 if (user.is2FAEnabled) {
//                   // Generate 6-digit code
//                   const code = Math.floor(100000 + Math.random() * 900000).toString();
            
//                   // Save code and expiry to user or a separate model (for security, add expiry e.g. 10min)
//                   user.twoFAOtp = code;
//                   user.twoFAOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//                   await user.save();


//                   user.lastLogin = new Date();
//                   await user.save();
              
            
//                   // Send code to user's email
//                   const emailSubject = "Your login verification code";
//                   const emailBody = `<p>Your login code is <b>${code}</b>. It expires in 10 minutes.</p>`;
//                   await sendEmail(email, emailSubject, emailBody);
            
//                   // Don't send JWT yet, only return info for client
//                   return res.status(200).json({
//                     message: "2FA code sent to your email",
//                     user: {
//                       email: user.email,
//                       is2FAEnabled: true
//                     }
//                   });
//                 }

//                 // console.log("email is ",user.is2FAEnabled);
                
        
//                 // send email
//                 const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
//                 const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`;
//                 const emailSubject = "Verify your email";
        
//                 const isEmailSent = await sendEmail(email, emailSubject, emailBody);

//                 if(user.is2FAEnabled == true){
//                   sendEmail(email, emailSubject, emailBody)
//                 }
        
//                 if (!isEmailSent) {
//                   return res.status(500).json({
//                     message: "Failed to send verification email",
//                   });
//                 }
        
//                 res.status(201).json({
//                   message:
//                     "Verification email sent to your email. Please check and verify your account.",
//                 });
//               }
//             }
        
//             const isPasswordValid = await bcrypt.compare(password, user.password);
        
//             if (!isPasswordValid) {
//               return res.status(400).json({ message: "Invalid email or password" });
//             }
        
//             const token = jwt.sign(
//               { userId: user._id, purpose: "login" },
//               process.env.JWT_SECRET,
//               { expiresIn: "7d" }
//             );
        
//             user.lastLogin = new Date();
//             await user.save();
        
//             const userData = user.toObject();
//             delete userData.password;
        
//             res.status(200).json({
//               message: "Login successful",
//               token,
//               user: userData,
//             })
        
//     } catch (error) {
//         console.error("Error in registeruser:", error);
//         res.status(500).json({ message: "Internal Server Error 3" });
//     }

// }




const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      // ... your existing email verification logic ...
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2FA logic
    if (user.is2FAEnabled) {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("code is ", code);

      // Save code and expiry to user or a separate model (for security, add expiry e.g. 10min)
      user.twoFAOtp = code;
      user.twoFAOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Send code to user's email
      const emailSubject = "Your login verification code";
      const emailBody = `<p>Your login code is <b>${code}</b>. It expires in 10 minutes.</p>`;
      await sendEmail(email, emailSubject, emailBody);

      // Don't send JWT yet, only return info for client
      return res.status(200).json({
        message: "2FA code sent to your email",
        user: {
          email: user.email,
          is2FAEnabled: true
        }
      });
    }

    // Else, normal login
    const token = jwt.sign(
      { userId: user._id, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const verifyEmail = async (req, res) => {
  
    try {
        const { token } = req.body;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if(!payload){
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { userId, purpose } = payload;

        if (purpose !== "email-verification") {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const verification = await Verification.findOne({
            userId,
            token,
          });
      
          if (!verification) {
            return res.status(401).json({ message: "Unauthorized" });
          }
          const isTokenExpired = verification.expiresAt < new Date();

          if (isTokenExpired) {
            return res.status(401).json({ message: "Token expired" });
          }
          const user = await User.findById(userId);

          if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
          }
      
          if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email already verified" });
          }
          user.isEmailVerified = true;
          await user.save();
          await Verification.findByIdAndDelete(verification._id);

          res.status(200).json({ message: "Email verified successfully" });


    } catch (error) {
        console.error("Error in verifyEmail:", error);
        res.status(500).json({ message: "Internal Server Error 3" });
    }

}

const resetPasswordRequest = async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
  
      // if (!user) {
      //   return res.status(400).json({ message: "User not found" });
      // }
  
      if (!user.isEmailVerified) {
        return res
          .status(400)
          .json({ message: "Please verify your email first" });
      }
  
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });
  
      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res.status(400).json({
          message: "Reset password request already sent",
        });
      }
  
      if (existingVerification && existingVerification.expiresAt < new Date()) {
        await Verification.findByIdAndDelete(existingVerification._id);
      }
  
      const resetPasswordToken = jwt.sign(
        { userId: user._id, purpose: "reset-password" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
  
      await Verification.create({
        userId: user._id,
        token: resetPasswordToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
  
      const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
      const emailBody = `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password</p>`;
      const emailSubject = "Reset your password";
  
      const isEmailSent = await sendEmail(email, emailSubject, emailBody);
  
      if (!isEmailSent) {
        return res.status(500).json({
          message: "Failed to send reset password email",
        });
      }
  
      res.status(200).json({ message: "Reset password email sent" });
    
      
    }
    catch (error) {
        console.error("Error in resetPasswordRequest:", error);
        res.status(500).json({ message: "Internal Server Error 4" });
    }
}

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;

    if (purpose !== "reset-password") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });

    if (!verification) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isTokenExpired = verification.expiresAt < new Date();

    if (isTokenExpired) {
      return res.status(401).json({ message: "Token expired" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// const verify2FA = async (req, res) => {
//   try {
//     const { email, code } = req.body;
//     const user = await User.findOne({ email });

//     if (
//       !user ||
//       !user.twoFACode ||
//       user.twoFACode !== code ||
//       !user.twoFACodeExpires ||
//       user.twoFACodeExpires < new Date()
//     ) {
//       return res.status(400).json({ message: "Invalid or expired code" });
//     }

//     // Clear the code
//     user.twoFACode = undefined;
//     user.twoFACodeExpires = undefined;
//     await user.save();

//     // Now issue JWT
//     const token = jwt.sign(
//       { userId: user._id, purpose: "login" },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );
//     const userData = user.toObject();
//     delete userData.password;

//     res.status(200).json({
//       message: "2FA verification successful",
//       token,
//       user: userData,
//     });
//   } catch (error) {
//     console.error("Error in verify2FA:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


const verify2FA = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email }).select("+twoFAOtp +twoFAOtpExpires");


    if(!user){
      return res.status(404).json({ message: "User not found" });
    }


    // if (
    //   !user ||
    //   !user.twoFAOtp ||
    //   user.twoFAOtp !== code ||
    //   !user.twoFACodeExpires ||
    //   user.twoFAOtpExpires < new Date()
    // ) {
    //   return res.status(400).json({ message: "Invalid or expired code" });
    // }

    // // Clear the code
    // user.twoFACode = undefined;
    // user.twoFACodeExpires = undefined;
    // await user.save();

   // console.log("user is ", email);
    if (
      !user ||
      !user.twoFAOtp ||
      user.twoFAOtp !== code ||
      !user.twoFAOtpExpires ||
      user.twoFAOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    
    // Clear the code after successful verification
    user.twoFAOtp = undefined;
    user.twoFAOtpExpires = undefined;
    await user.save();
    

    // Now issue JWT
    const token = jwt.sign(
      { userId: user._id, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "2FA verification successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Error in verify2FA:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

 

export {
    registeruser ,
    loginUser,
    verifyEmail,
    resetPasswordRequest,
    verifyResetPasswordTokenAndResetPassword,
    verify2FA
}