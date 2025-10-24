# iRaceResults API Documentation

This document defines all API endpoints available in the iRaceResults Express application.

## Base URL
The application runs on the configured port (see `appconfig.js`).

## Authentication Routes
Authentication routes are handled separately via `/auth` endpoints (see `authRoutes.js`).

## Admin Routes
Admin routes are handled separately via `/admin` endpoints (see `admin.js`).

---

## Global Endpoints

### GET /cache
Returns the entire cached league data.

**Response:**
- Content-Type: `application/json`
- Body: Complete cache object containing all league data

---

### GET /leaguelist
Returns a list of all available leagues.

**Response:**
- Content-Type: `application/json`
- Body: Array of league identifiers

---

## Static Asset Endpoints

### GET /img/:route
Serves static image files.

**Parameters:**
- `route` (path): Image filename

**Supported routes:**
- `leftbar.png` - Left sidebar image
- `middlebar.png` - Middle sidebar image

**Response:**
- Content-Type: `image/png`
- Body: Image file

---

### GET /:leagueid/img/:route
Serves league-specific image files.

**Parameters:**
- `leagueid` (path): League identifier (case-insensitive, converted to uppercase)
- `route` (path): Image filename

**Supported routes:**
- `header.png` - League header image from `/data/{LEAGUEID}/img/`
- `footer.png` - League footer image from `/data/{LEAGUEID}/img/`

**Response:**
- Content-Type: `image/png`
- Body: Image file
- Error: "Sorry, this is an unknown league." if league ID is invalid

---

## League Endpoints

### GET /:leagueid
Serves the main tables page for a specific league.

**Parameters:**
- `leagueid` (path): League identifier (case-insensitive, converted to uppercase)

**Response:**
- Content-Type: `text/html`
- Body: `tables.html` page if league exists
- Error: "Sorry, this is an unknown league." if league ID is invalid

---

### GET /:leagueid/:route
Main routing endpoint for league-specific data and pages.

**Parameters:**
- `leagueid` (path): League identifier (case-insensitive, converted to uppercase)
- `route` (path): Specific resource or action

#### Static Files
- `favicon.ico` - Returns favicon
- `bkgrnd.jpg` - Returns background image
- `leftbar.png` - Returns left sidebar image
- `middlebar.png` - Returns middle sidebar image
- `header.png` - Returns league-specific header image
- `footer.png` - Returns league-specific footer image
- `blank.png` - Returns blank trackmap image
- `style.css` - Returns stylesheet

#### Page Routes
- `tables` - Redirects to `/:leagueid`
- `penalties` - Returns `penalties.html` page
- `results` - Returns `results.html` page (sets leagueid cookie)

#### Data API Routes

**displayconfig**
- Returns: Display configuration for tables
- Content-Type: `application/json`
- Response: Display configuration object

**classtotals**
- Returns: Filtered class totals for the league
- Content-Type: `application/json`
- Response: Class totals array (async)

**teamstotals**
- Returns: Team totals for the league
- Content-Type: `application/json`
- Response: Team totals from cache

**licencepoints**
- Returns: Licence points data for the league
- Content-Type: `application/json`
- Response: Licence points array from cache

**fullresults**
- Returns: Complete results data for the league
- Content-Type: `application/json`
- Response: Full results object from cache

**classes**
- Returns: Classes configuration for the league
- Content-Type: `application/json`
- Response: Classes array from cache

**protests**
- Returns: Protests data for the league
- Content-Type: `application/json`
- Response: Protests array from cache

**drivers**
- Returns: All drivers in the league
- Content-Type: `application/json`
- Response: Drivers array from cache

**rounds**
- Returns: Rounds information for the league
- Content-Type: `application/json`
- Response: Rounds array

**penaltiesjson**
- Returns: Penalties data in JSON format
- Content-Type: `application/json`
- Response: Penalties array from cache

**completedrounds**
- Returns: Information about completed rounds
- Content-Type: `application/json`
- Response: Completed rounds array

**driverlist**
- Returns: List of all drivers (same as `drivers`)
- Content-Type: `application/json`
- Response: Drivers array from cache

**lastrecalc**
- Returns: Most recent recalculation information
- Content-Type: `application/json`
- Response: Most recent recalculation object or null
- Error: 500 if error retrieving data

#### Actions

**reload**
- Action: Reloads cache data from saved files for the league
- Response: "reloaded Cache for {LEAGUEID}"

**Response for unknown routes:**
- "UNKNOWN ROUTE : The leagueid you specified is {LEAGUEID} and the route requested is :{ROUTE}"

---

## POST Endpoints

### POST /:leagueid/:route
Handles POST requests for league-specific operations.

**Parameters:**
- `leagueid` (path): League identifier (case-insensitive, converted to uppercase)
- `route` (path): Specific operation

#### map
Retrieves a track map image based on the round name.

**Request Body:**
```json
{
  "round_name": "string"
}
```

**Supported Tracks:**
- Fuji
- RBull
- Spa
- Imola
- Thrux
- Dayt
- LagSeca
- Brands
- NurbGP

**Response:**
- Content-Type: `image/png`
- Body: Track map image file
- Returns `blank.png` if round_name is "none"
- Returns `nomap.png` if track is not available

---

#### results
Retrieves filtered results for a specific round and customer.

**Request Body:**
```json
{
  "round_no": "number",
  "cust_id": "number"
}
```

**Response:**
- Content-Type: `application/json`
- Body: Filtered results array

---

#### irresults
Retrieves iRacing session results file.

**Request Body:**
```json
{
  "round_no": "number",
  "session_no": "number"
}
```

**Response:**
- Content-Type: `application/json`
- Body: iRacing session results JSON file
- Error: "No such round/session" if session ID is 0

**File Location:**
`/data/{LEAGUEID}/irresults/{SESSION_ID}.json`

---

## Middleware Routes

### Protest Routes
Handled by the `protest` module at `/:leagueid/protest/*`
See `protest.js` for detailed endpoints.

### Registration Routes
Handled by the `register` module at `/:leagueid/register/*`
See `register.js` for detailed endpoints.

---

## Error Handling

### Unknown League
When an invalid league ID is provided:
- Response: "Sorry, this is an unknown league."

### Unknown URL
For any unmatched routes:
- Response: "Sorry, this is an unknown URL."

### Unknown POST Route
For unmatched POST routes:
- Response: "UNKNOWN POST ROUTE : The leagueid you specified is {LEAGUEID} and the route requested is :{ROUTE}"

---

## Notes

1. All league IDs are case-insensitive and converted to uppercase
2. Valid league IDs are defined in `config.leagueIDs`
3. Some routes set cookies (e.g., `results` route sets `leagueid` cookie)
4. Static files are served from `/script`, `/html`, and `/css` directories
5. League-specific data is stored under `/data/{LEAGUEID}/`
6. All requests are logged with timestamp and URL

---

## Known Issues
As documented in app.js:
- Protest numbering sequence incorrect
- If more than one round is open for protest, events for only the first round are shown
- Dividing lines are missing in scores table
