const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { GetClient } = require("./DB_Handler");
var logger = require("./Logger");

// SERVER FUNCTIONS

/* 
    * Queries the database and returns the result.
    * @param {Object} filter - The filter to apply to the query.
    * @param {Object} projection - The projection to apply to the query.
    * @param {Number} limit - The maximum number of documents to return.
    * @param {Number} skip - The number of documents to skip.
    * @returns {Array} The result of the query.
    * @throws {Error} If the database connection fails.
*/
async function query_db(filter = {}, projection = {}, limit = 20, skip = 0) {
    // filter, projection, limit, and skip are all optional
    const db_client = await GetClient();
    const db = db_client.db("Scrapy_db");
    const col = db.collection("Articles");
    const result = await col
        .find(filter)
        .project(projection)
        .limit(limit)
        .skip(skip)
        .toArray();
    return result;
}

/*
    * Run an aggregation pipeline on the database and returns the result.
    * @param {Array} pipeline - The aggregation pipeline to apply to the query.
    * @returns {Array} The result of the aggregation.
    * @throws {Error} If the database connection fails.
    * @throws {Error} If the pipeline is empty.
    * @throws {Error} If the pipeline elements are not JSON objects.
*/
async function aggregate_db(pipeline) {
    if (pipeline.length < 1) {
        throw new Error("Pipeline must be a non-empty array");
    }
    const db_client = await GetClient();
    const db = db_client.db("Scrapy_db");
    const col = db.collection("Articles");
    const result = await col.aggregate(pipeline, { allowDiskUse: true }).toArray();
    return result;
}

/*
    * Ruyns a text search query on the database and returns the result.
    * @param {String} query - The query to search for.
    * @param {Object} projection - The projection to apply to the query.
    * @param {Number} limit - The maximum number of documents to return.
    * @param {Number} skip - The number of documents to skip.
    * @param {String} path - The path to search in.
    * @returns {Array} The result of the search.
    * @throws {Error} If the database connection fails. 
*/
async function search_db(query, projection=null, limit=10, skip=0, path=null) {
    let search_stage = { $search: { index: "news_text_search", text: { query: query, path: { wildcard: "*" } } } }
    if (path) {
        search_stage["$search"]["text"]["path"] = path;
    }
    let pipeline = [search_stage]
    if (projection) {
        pipeline.push({ $project: projection });
    }
    if (skip) {
        pipeline.push({ $skip: skip });
    }
    if (limit) {
        pipeline.push({ $limit: limit });
    }
    const db_client = await GetClient();
    const db = db_client.db("Scrapy_db");
    const col = db.collection("Articles");
    const result = await col.aggregate(pipeline, { allowDiskUse: true }).toArray();
    return result;
}

// VALIDATION PIPES

const FIND_VAL_PIPE = [
    body()
        .exists().withMessage("Body is required")
        .isObject().withMessage("Body must be a JSON object"),
    body("filter")
        .optional()
        .isObject().withMessage("Filter must be a JSON object"),
    body("projection")
        .optional()
        .isObject().withMessage("Projection must be a JSON object"),
    body("limit")
        .optional()
        .isInt().withMessage("Limit must be an integer"),
    body("skip")
        .optional()
        .isInt().withMessage("Skip must be an integer")
]

const AGGREGATE_VAL_PIPE = [
    body()
        .exists().withMessage("Body is required")
        .isObject().withMessage("Body must be a JSON object"),
    body("pipeline")
        .exists().withMessage("Pipeline is required")
        .isArray(min = 1).withMessage("Pipeline must be a non-empty array")
        // validate each element of the pipeline
        .custom((value, { req }) => {
            for (let i = 0; i < value.length; i++) {
                if (typeof value[i] !== "object") {
                    throw new Error("Pipeline elements must be JSON objects");
                }
                if (value[i]['$graphLookup'] || value[i]['$facet'] || value[i]['$lookup'] || value[i]['$out']) {
                    throw new Error("Pipeline cannot include the $graphLookup, $facet, $lookup, or $out stages");
                }
            }
            return true;
        })
]

const SEARCH_VAL_PIPE = [
    body()
        .exists().withMessage("Body is required")
        .isObject().withMessage("Body must be a JSON object"),
    body("query")
        .exists().withMessage("Query is required")
        .isString().withMessage("Query must be a JSON object"),
    body("projection")
        .optional()
        .isObject().withMessage("Projection must be a JSON object"),
    body("limit")
        .optional()
        .isInt().withMessage("Limit must be an integer"),
    body("skip")
        .optional()
        .isInt().withMessage("Skip must be an integer"),
    body("path") // path is optional, but if it exists, it must be one of "title", "text", or "topic"
        .optional()
        .isString().withMessage("Path must be a string")
        .custom((value, { req }) => {
            if (value !== "title" && value !== "text" && value !== "topic") {
                throw new Error("Path must be one of 'title', 'text', or 'topic'");
            }
            return true;
        })
]

// API ENDPOINTS

router.post("/find", FIND_VAL_PIPE, async (req, res) => {
    const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return null;
	}
    const filter = req.body.filter;
    const projection = req.body.projection;
    const limit = req.body.limit;
    const skip = req.body.skip;
    try {
        const result = await query_db(filter, projection, limit, skip);
        res.status(200).json(result);
    } catch (err) {
        res.status=500;
        return res.json(err);
    }
});

router.post("/aggregate", AGGREGATE_VAL_PIPE, async (req, res) => {
    const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return null;
	}
    const pipeline = req.body.pipeline;
    try {
        const result = await aggregate_db(pipeline);
        res.status(200).json(result);
    } catch (err) {
        res.status=500;
        return res.json(err);
    }
});

router.post("/search", SEARCH_VAL_PIPE, async (req, res) => {
    const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return null;
	}
    const query = req.body.query;
    const projection = req.body.projection;
    const limit = req.body.limit;
    const skip = req.body.skip;
    const path = req.body.path;
    try {
        const result = await search_db(query, projection, limit, skip, path);
        res.status(200).json(result);
    } catch (err) {
        res.status=500;
        return res.json(err);
    }
});

module.exports = router;