const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios"); // const axios'
const cors = require("cors");
require("dotenv").config();

mongoose.Promise = global.Promise;

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["*","https://smart-farming-virid.vercel.app"],
		methods: ["*"],
	},
});

const Dataset = require("./model/dataset.js");

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: "smartfarmingunpad",
	})
	.then(
		() => {
			console.log("Database sucessfully connected!");
		},
		(error) => {
			console.log("Could not connect to database : " + error);
		}
	);

app.use(
    cors({
        origin: ["*","https://smart-farming-virid.vercel.app"], // Allow the specific origin of your frontend
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
	Dataset
		.find({
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
	socket.on("getData", async ({ device_id, index_id }) => {
        console.log(device_id, index_id);
        try {
            // Emit initial data
            const initialData = await getLatestData(device_id, index_id);
            console.log('initial', initialData);
            socket.emit('data', initialData);

            // Set up change stream to watch for new documents
            const changeStream = Dataset.watch([
                { $match: { 'fullDocument.device_id': device_id, 'fullDocument.index_id': index_id } }
            ]);

            changeStream.on('change', async (change) => {
                if (change.operationType === 'insert') {
                    const newData = change.fullDocument;
                    socket.emit('data', newData);
                }
            });

            socket.on('disconnect', () => {
                changeStream.close();
                console.log('User disconnected');
            });
        } catch (error) {
            console.error('Error:', error);
            socket.emit('error', 'An error occurred while fetching data');
        }
	});
});

async function getLatestData(device_id, index_id) {
	return await Dataset.findOne({
		device_id: device_id,
		index_id: index_id,
	}).sort({ createdAt: -1 });
}

app.get("/", (req, res) => {
	res.send({ message: "Halooo" });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
