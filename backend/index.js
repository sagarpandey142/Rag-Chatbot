import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.js";
import dotenv from "dotenv"
dotenv.config()

const app = express();
const PORT=process.env.PORT
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running ");
});
app.use("/chat", chatRoutes);

app.listen(5000, () => {
  console.log(`server started on port ${PORT}`);
});
