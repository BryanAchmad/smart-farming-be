const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios"); // const axios'
const cors = require("cors");
require("dotenv").config();
const { parse } = require("url");

mongoose.Promise = global.Promise;

const app = express();

const server = createServer((req, res) => {
	const { pathname } = parse(req.url);
	if (pathname === "/socket.io/") {
		res.writeHead(400);
		res.end();
	}
});
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:5173", "https://smart-farming-virid.vercel.app"],
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"], // Add this line
	pingTimeout: 60000, // Add this line
	pingInterval: 25000, // Add this line
	logger: console,
	debug: true,
});

io.setMaxListeners(20);

const Dataset = require("./model/dataset.js");

mongoose
	.connect(process.env.MONGO_URI, {
		dbName: "smartfarmingunpad",
		serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
		socketTimeoutMS: 45000,
	})
	.then(() => {
		console.log("Database successfully connected!");
	})
	.catch((error) => {
		console.log("Could not connect to database: " + error);
	});

// Handle connection errors after initial connection
mongoose.connection.on("error", (error) => {
	console.error("MongoDB connection error:", error);
});

// Optional: Handle application termination
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

app.use(
	cors({
		origin: ["http://localhost:5173", "https://smart-farming-virid.vercel.app"], // Allow the specific origin of your frontend
		methods: ["*"], // Allow all methods
	})
);
// Middleware
app.use(express.json());

app.post("/user/login", (req, res) => {
	console.log(req.body);
	axios
		.post("https://api.smartfarmingunpad.com/user/login", {
			email: req.body.email,
			password: req.body.password,
		})
		.then((response) => {
			console.log(response.data);
			res.send(response.data); // Respond to the client
		})
		.catch((error) => {
			// console.error(error);
			res.send(error);
		});
});

app.get("/dataset", (req, res) => {
	console.log("req", req.query);
	Dataset.find({
		device_id: req.query.device_id,
		index_id: req.query.index_id,
	})
		.sort({ createdAt: -1 })
		.limit(1)
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			return res.json(err);
		});
});

io.on("connection", (socket) => {
	console.log("New client connected");
	const changeStreams = {};
	socket.on("getData", async ({ device_id, index_id }) => {
		console.log(
			`getData request for device_id: ${device_id}, index_id: ${index_id}`
		);
		try {
			// Emit initial data
			const initialData = await getLatestData(device_id, index_id);
			console.log("initial", initialData);
			socket.emit("data", initialData);

			const streamKey = `${device_id}_${index_id}`;

			if (changeStreams[streamKey]) {
				changeStreams[streamKey].close();
			}

			// Set up change stream to watch for new documents
			changeStreams[streamKey] = Dataset.watch([
				{
					$match: {
						"fullDocument.device_id": device_id,
						"fullDocument.index_id": index_id,
					},
				},
			]);

			changeStreams[streamKey].on("change", async (change) => {
				if (change.operationType === "insert") {
					const newData = change.fullDocument;
					console.log("Emitting new data:", newData);
					socket.emit("data", newData);
				}
			});

			// socket.on('disconnect', () => {
			//     changeStream.close();
			//     console.log('User disconnected');
			// });
		} catch (error) {
			console.error("Error:", error);
			socket.emit("error", "An error occurred while fetching data");
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected");
		// Close all change streams for this socket
		Object.values(changeStreams).forEach((stream) => stream.close());
	});
});

async function getLatestData(device_id, index_id) {
	return await Dataset.findOne({
		device_id: device_id,
		index_id: index_id,
	}).sort({ createdAt: -1 });
}

io.on("connect_error", (err) => {
	console.log(`connect_error due to ${err.message}`);
});

app.get("/", (req, res) => {
	res.send({ message: "Halooo" });
});

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
