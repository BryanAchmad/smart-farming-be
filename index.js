const express = require("express");
// const { createServer } = require("http");
// const { Server } = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios"); // const axios'
const cors = require("cors");
require("dotenv").config();

mongoose.Promise = global.Promise;

const app = express();
// const server = createServer(app);
// const io = new Server(server, {
// 	cors: {
// 		origin: "*",
//         methods: ["GET", "POST"]
// 	},
// });

const dataset =require('./model/dataset.js')

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
app.use(cors({
    origin: "*",
}))
// Middleware
app.use(express.json());


app.post("/user/login", (req, res) => {
    console.log(req.body)
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
            res.send(error)
		});
});

app.get("/dataset", (req, res) => {
    console.log("req", req.query)
    dataset
    .find({
        device_id: req.query.device_id,
        index_id: req.query.index_id
    })
    .sort({createdAt: -1})
    .limit(1)
    .then((data) => {
        console.log('data', data)
        return res.json(data);
    })
    .catch(err => {
        return res.json(err);
    })
});

// Set up Socket.IO
// io.on("connection", (socket) => {
//     console.log("A client connected: ", socket.id);

//     socket.on("subscribeToDataset", async (params) => {
//         console.log(`Client ${socket.id} subscribed to device ${params.device_id} and index ${params.index_id}`);

//         try {
//             // Create a change stream with filters for the specific device_id and index_id
//             const changeStream = dataset.watch([
//                 {
//                     $match: {
//                         operationType: "insert",
//                         "fullDocument.device_id": params.device_id,
//                         "fullDocument.index_id": params.index_id
//                     }
//                 }
//             ]);

//             // Handle new inserts and emit to the specific client
//             changeStream.on("change", (change) => {
//                 if (change.operationType === "insert") {
//                     const newData = change.fullDocument;
//                     console.log(`New data for device ${params.device_id} and index ${params.index_id}:`, newData);
//                     socket.emit(`newData-${params.device_id}-${params.index_id}`, newData);
//                 }
//             });

//             socket.on("disconnect", () => {
//                 console.log(`Client ${socket.id} disconnected`);
//                 changeStream.close(); // Clean up the change stream on disconnect
//             });
//         } catch (err) {
//             console.error(`Error subscribing to dataset for device ${params.device_id} and index ${params.index_id}:`, err);
//             socket.emit("error", err);
//         }
//     });
// });

// Set up Socket.IO
// io.on("connection", (socket) => {
//     console.log("A client connected: ", socket.id);

//     socket.on("subscribeToDataset", async (params) => {
//         console.log(`Client ${socket.id} subscribed to device ${params.device_id} and index ${params.index_id}`);

//         try {
//             const changeStream = dataset.watch([
//                 {
//                     $match: {
//                         operationType: "insert",
//                         "fullDocument.device_id": params.device_id,
//                         "fullDocument.index_id": params.index_id,
//                     },
//                 },
//             ]);

//             changeStream.on("change", (change) => {
//                 if (change.operationType === "insert") {
//                     const newData = change.fullDocument;
//                     console.log(newData)
//                     console.log(`New data for device ${params.device_id} and index ${params.index_id}:`, newData);
//                     socket.emit(`newData-${params.device_id}-${params.index_id}`, newData);
//                 }
//             });

//             socket.on("disconnect", () => {
//                 console.log(`Client ${socket.id} disconnected`);
//                 changeStream.close();
//             });
//         } catch (err) {
//             console.error(`Error subscribing to dataset for device ${params.device_id} and index ${params.index_id}:`, err);
//             socket.emit("error", err);
//         }
//     });
// });

app.get("/", (req, res) => {
	res.send({ message: "Halooo" });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
