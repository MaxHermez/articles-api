var winston = require("winston");


// Logger configuration
const opts = {
	level: "info",
	format: winston.format.combine(
        winston.format.errors({ stack: true }),
		winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss" }),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({
			filename: "./logs/error.log",
			level: "error",
		}),
		new winston.transports.File({
			filename: "./logs/backend.log",
		}),
	],
};
logger = winston.createLogger(opts);
if (process.platform !== "linux") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		})
	);
}
module.exports = logger;