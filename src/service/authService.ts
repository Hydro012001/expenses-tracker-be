import { Request, Response } from "express";
import { LoginRequestInterface } from "../interface/request/loginRequestInterface";
import {
  getUserByEmail,
  SaveUser,
  updateUserVerified,
} from "../repository/User";
import { UserAttributes } from "../interface/User";
import { comparePassword } from "../utils/hashUtils";
import { generateAccessToken, verifyToken } from "../utils/jwtUtils";
import { sendVerificationEmail } from "../utils/emailUtils";
import { checkToken, deleteToken, SaveToken } from "../repository/Token";
import { feurl } from "../utils/envValue";

export const loginService = async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequestInterface;

  const user = (await getUserByEmail(email)) as UserAttributes;

  // return res.status(200).send(user);
  if (!user) {
    return res.status(404).json({ message: "User email not found" });
  }
  const isMatch = await comparePassword(password, String(user.password));
  if (!isMatch) {
    return res.status(401).json({ message: "Password not match." });
  }

  if (!user.isVerified) {
    return res
      .status(403)
      .json({ message: "Email is not yet verified please verified it." });
  }
  const token = generateAccessToken(user);
  console.log("User login successfully", user);
  return res.status(200).send({ token });
};

export const verifyTokenService = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token!");

  try {
    const decode = verifyToken(String(token));

    if (decode) {
      if (!(await checkToken(String(token), String(decode.decoded?.email)))) {
        return res
          .status(400)
          .send({ verified: false, message: "Invalid token!" });
      }
      await updateUserVerified(String(decode.decoded?.email));
      await deleteToken(String(token), String(decode.decoded?.email));
      return res
        .status(200)
        .send({ verified: true, message: "Verification success" });
    } else {
      return res
        .status(400)
        .send({ verified: false, message: "Invalid token!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong!");
  }
};

export const signUpUser = async (req: Request, res: Response) => {
  const user = req.body as UserAttributes;

  const existingUser = await getUserByEmail(user.email);

  if (existingUser) {
    return res.status(409).json({ message: "Email is already been used" });
  }

  const token = generateAccessToken(user);
  const payload = {
    token,
    email: user.email,
  };
  await SaveToken(payload);
  const link = `${feurl}/#/verify?token=${token}`;
  await sendVerificationEmail(user.email, link);
  await SaveUser(user);
  return res.status(200).json({ message: "Signup succesffully" });
};
