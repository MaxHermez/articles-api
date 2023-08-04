const { MongoClient } = require("mongodb");
var logger = require("./Logger");

var appClient = null;

// test the client's connection
async function testConnection() {
	try {
		await appClient.db("admin").command({ ping: 1 });
		return true;
	} catch (err) {
		return false;
	}
}

/**
 * It creates a new MongoClient object if one doesn't already exist, and returns it.
 * Singleton pattern.
 * @returns The MongoClient object.
 */
async function GetClient() {
	if (process.env.MONGO_URI == undefined) {
		throw logger.error("couldn't find db credentials file config.json");
	}
	last_time = Date.now();
	if (!appClient) { // if a client doesn't exist, create one
		appClient = new MongoClient(process.env.MONGO_URI);
		try {
			await appClient.connect();
			logger.debug("Database connected successfully");
		} catch (err) {
			logger.error("Database connection error: ", err);
		}
	} else if (!(await testConnection())) { // if a client exists but the connection is dead, create a new one
		appClient.close();
		appClient = new MongoClient(process.env.MONGO_URI);
		try {
			await appClient.connect();
			logger.debug("Database connected successfully");
		} catch (err) {
			logger.error("Database connection error: ", err);
		}
	}
	return appClient;
}

module.exports = { GetClient };