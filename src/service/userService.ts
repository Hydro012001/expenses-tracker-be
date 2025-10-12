import { Request, Response } from "express";
import { getUserByID, updateUser } from "../repository/User";
import { UserAttributes } from "../interface/User";

export const getUserByIdService = async (req: Request, res: Response) => {
  const userId = req.session.userId;

  const user = (await getUserByID(String(userId))) as UserAttributes;

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const formattedUser = {
    ...user,
    createdAt: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A",
  };

  // remove password from response
  const { password, ...safeUser } = formattedUser;

  return res.status(200).send(safeUser);
};

export const updateUserInformation = async (req: Request, res: Response) => {
  const user = req.body as UserAttributes;

  const existingUser = await getUserByID(String(req.session.userId));

  if (existingUser) {
    // user.password = await hashPassword(String(user.password));
    user.id = Number(req.session.userId);
    const updateduser = await updateUser(user);
    return res
      .status(200)
      .json({ message: "User updated successfully", user: updateduser });
  } else {
    return res.status(404).json({ message: "User not found" });
  }
};
