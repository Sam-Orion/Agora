import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect input",
    });
  }
  try {
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        // TODO: Hash the password, use b-crypt library
        password: parsedData.data.password,
        name: parsedData.data.name,
      },
    });
    return res.json({
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Signup failed",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect input",
    });
    return;
  }

  // TODO: Compare the hash passwords here
  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.username,
      password: parsedData.data.password,
    },
  });

  if (!user) {
    return res.status(403).json({
      message: "Not Authorised",
    });
  }

  const token = jwt.sign(
    {
      userId: user?.id,
    },
    JWT_SECRET,
  );

  res.json({
    token,
  });
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect input",
    });
    return;
  }

  // @ts-ignore
  // TODO: Fix this
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.roomName,
        adminId: userId,
      },
    });
    // db call

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "A room with this name already exists",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  const messages = await prismaClient.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: {
      id: "desc",
    },
    take: 50,
  });

  res.json({
    messages,
  });
});

app.listen(3001);
