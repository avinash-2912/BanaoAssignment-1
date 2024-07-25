import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { hash } from "../lib/encryption.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user!" });
  }
};


export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
        secure:true,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = uuidv4();

    await prisma.passwordReset.create({
      data: {
        email,
        token: hash(resetToken),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    console.log(`Reset token generated and sent to ${email}: ${resetToken}`);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to process request" });
  }
};


export const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        token:hash(token),
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordReset.delete({
      where: {
        id: resetRequest.id,
      },
    });

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to process request" });
  }
};