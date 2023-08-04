const express = require("express");
require('dotenv').config();
var cors = require("cors");
var logger = require("./src/Logger");
const DB_Share = require("./src/DB_Share");

const app = express();
const PORT = process.env.PORT || 8000;

app.use("*", cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toString()} - ${req.originalUrl} - ${req.method}`);
    next();
});
app.use(DB_Share);

app.listen(PORT, () => {
	logger.info(`Server listening on ${PORT}`);
});