require('dotenv').config();

const Redis = require("ioredis")
const redis = new Redis('rediss://default:gQAAAAAAAYwgAAIgcDI0ZTVlMzU3ZWU3NjU0MTRiOGE0YzIwNGNlYWY4OTk3Nw@driving-kodiak-101408.upstash.io:6379', {
    maxRetriesPerRequest: null,
});

module.exports = redis;