const express = require('express');
const axios = require('axios');
const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_KEY = 'stations_data';
const CACHE_TTL = 60 * 30;
const API_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

const app = express();
const port = process.env.PORT || 3000;

const redisClient = createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);


async function fetchAndCacheStations() {
  console.log('Fetching data from remote API...');
  const { data } = await axios.get(API_URL);
  await redisClient.set(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }), {
    EX: CACHE_TTL
  });
  console.log('Data fetched and cached.');
  return data;
}


async function getStations() {
  const cached = await redisClient.get(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    console.log('Returning cached data.');
    if (Date.now() - timestamp > CACHE_TTL * 1000) {
      console.log('Cache expired, refreshing in background...');
      fetchAndCacheStations().catch(() => {});
    }
    return data;
  } else {
    console.log('No cache found, fetching data...');
    return await fetchAndCacheStations();
  }
}


app.get('/stations', async (req, res) => {
  console.log('Requested /stations');
  try {
    const data = await getStations();
    res.json(data);
  } catch (err) {
    console.error('Error fetching station data:', err);
    res.status(500).json({ error: 'Failed to fetch station data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
