import express from "express";

import cors from "cors";
import dotenv from "dotenv";

import db, { insertDefaultUser } from "./model/modelsConfig";
import { Sequelize } from "sequelize";
import { routes } from "./routes/routesConfig";
import session from "express-session";
import { databaseHost, secretSessionEnv } from "./utils/envValue";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const secreSession = secretSessionEnv;

interface CurrentUser {
  id: string;
  username: string;
  role: string;
}

declare module "express-session" {
  interface Session {
    userId: CurrentUser["id"];
    username?: CurrentUser["username"];
  }
}

app.use(
  session({
    secret: String(secreSession),
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.101:5173",
      "https://expenses-a-tracker.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/api", routes);
db.sequelize.sync({ force: false }).then(async (result: Sequelize) => {
  db.Associations();
  await insertDefaultUser();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
