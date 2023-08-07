# Set up

This repository needs a .env file or environment variables to run.

## .env file contents

```
MONGO_URI=YOUR_MONGO_URI
MONGO_DB=YOUR_MONGO_DB
MONGO_COL=YOUR_MONGO_COLLECTION
```

## Running the API

First we'll have to install all the package dependencies. From the root directory of the repository run the following

```
npm i
```

And now we can run the API

```
node index.js
```

The API uses __port 8000___ by default, this can be changed by adding an environment variable to the __.env__ file

```
PORT=8281
```

# Usage 

This API provides endpoints to interact with a MongoDB database containing news articles collected from bbc.com/news

## Endpoints

### 1. POST /find

Runs a query on the database and returns the result.

#### Request Body:

- **filter** - The filter to apply to the query (optional, default: `{}`)
- **projection** - The projection to apply to the query (optional, default: `{}`)
- **limit** - The maximum number of documents to return (optional, default: `20`)
- **skip** - The number of documents to skip (optional, default: `0`)

#### Response:

- An array of documents that matches the query.

### 2. POST /aggregate

Runs an aggregation pipeline on the database and returns the result.

#### Request Body:

- **pipeline** - The MongoDB aggregation pipeline to apply to the query.

#### Response:

- An array of documents that matches the aggregation pipeline.

### 3. POST /search

Runs a text search query on the database and returns the result.

#### Request Body:

- **query** - The query to search for.
- **projection** - The projection to apply to the query (optional)
- **limit** - The maximum number of documents to return (optional, default: `10`)
- **skip** - The number of documents to skip (optional, default: `0`)
- **path** - The path to search for the query in. If used, must be one of the values \["title", "text", "topic"\] (optional, default: all fields)

#### Response:

- An array of documents that matches the search.

## Errors

All endpoints return standard HTTP status codes for success and failure. Specific error messages are returned in the body of the response.
