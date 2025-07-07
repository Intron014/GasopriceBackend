# GasopriceBackend

This is a Node.js backend service that fetches fuel station data from the Spanish government API, caches it in Redis, and refreshes the cache every 30 minutes if a request is received.

## Endpoint
- `GET /stations` — Returns the latest fuel station data (cached, refreshed every 30 minutes)
