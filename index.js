require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const Dataset = require("./model/dataset.js");
const { setupSocketHandlers } = require("./socketHandlers");

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
	cors: {
		origin: [process.env.CLIENT_URL, process.env.PROD_CLIENT_URL],
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
	pingTimeout: 60000,
	pingInterval: 25000,
});

// Middleware
app.use(
	cors({
		origin: [process.env.CLIENT_URL, process.env.PROD_CLIENT_URL],
		methods: ["GET", "POST"],
	})
);
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB Connection
mongoose
	.connect(process.env.MONGO_URI, {
		dbName: process.env.DB_NAME,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	})
	.then(() => console.log("Database successfully connected!"))
	.catch((error) => console.error("Could not connect to database:", error));

mongoose.connection.on("error", (error) => {
	console.error("MongoDB connection error:", error);
});

process.on("SIGINT", async () => {
	try {
		await mongoose.connection.close();
		console.log("MongoDB connection closed due to application termination");
		process.exit(0);
	} catch (error) {
		console.error("Error closing MongoDB connection:", error);
		process.exit(1);
	}
});

// Routes
app.post("/user/login", async (req, res) => {
	try {
		const response = await axios.post(
			"https://api.smartfarmingunpad.com/user/login",
			{
				email: req.body.email,
				password: req.body.password,
			}
		);
		res.json(response.data);
	} catch (error) {
		console.error("Login error:", error.message);
		res.status(500).json({ error: "An error occurred during login" });
	}
});

app.get("/dataset", async (req, res) => {
	try {
		const data = await Dataset.findOne({
			device_id: req.query.device_id,
			index_id: req.query.index_id,
		}).sort({ createdAt: -1 });
		res.json(data);
	} catch (error) {
		console.error("Dataset retrieval error:", error);
		res.status(500).json({ error: "An error occurred while fetching data" });
	}
});

app.get("/health", (req, res) => {
	res.status(200).send("OK");
});

// Socket.IO setup
setupSocketHandlers(io, Dataset);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
