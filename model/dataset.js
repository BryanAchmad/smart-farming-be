const { Schema, model } = require("mongoose");

const datasetSchema = new Schema(
  {
    index_id: String,
    device_id: String,
    value: Number,
  },
  {
    timestamps: true,
  }
);

const dataset = model("datasets", datasetSchema);

module.exports = dataset;