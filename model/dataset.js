import { Schema, model } from "mongoose";

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

export default dataset;