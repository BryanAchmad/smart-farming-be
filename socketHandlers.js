// socketHandlers.js

function setupSocketHandlers(io, Dataset) {
	io.on("connection", (socket) => {
		console.log("New client connected");
		const changeStreams = {};

		socket.on("getData", async ({ device_id, index_id }) => {
			console.log(
				`getData request for device_id: ${device_id}, index_id: ${index_id}`
			);
			try {
				const initialData = await getLatestData(Dataset, device_id, index_id);
				socket.emit("data", initialData);

				const streamKey = `${device_id}_${index_id}`;
				if (changeStreams[streamKey]) {
					changeStreams[streamKey].close();
				}

				changeStreams[streamKey] = Dataset.watch([
					{
						$match: {
							"fullDocument.device_id": device_id,
							"fullDocument.index_id": index_id,
						},
					},
				]);

				changeStreams[streamKey].on("change", (change) => {
					if (change.operationType === "insert") {
						socket.emit("data", change.fullDocument);
					}
				});
			} catch (error) {
				console.error("Error in getData event:", error);
				socket.emit("error", "An error occurred while fetching data");
			}
		});

		socket.on("disconnect", () => {
			console.log("User disconnected");
			Object.values(changeStreams).forEach((stream) => stream.close());
		});

		socket.on("error", (error) => {
			console.error("Socket error:", error);
		});
	});

	io.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});
}

async function getLatestData(Dataset, device_id, index_id) {
	return await Dataset.findOne({
		device_id: device_id,
		index_id: index_id,
	}).sort({ createdAt: -1 });
}

module.exports = { setupSocketHandlers };
