const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
	secret: process.env.JWT_SECRET,
	algorithms: ["HS256"],
});

