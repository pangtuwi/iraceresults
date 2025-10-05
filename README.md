# iraceresults
Automatic simracing league scoring system for iRacing.com

## Overview
iraceresults is a NodeJS web application that automatically processes iRacing.com sim racing league results and displays standings/scores. It provides a complete league management system with support for multi-class racing, teams, penalties, and protests.

## Core Architecture

### Data Flow
1. Downloads race results from iRacing.com API (stored as JSON in `data/{leagueID}/irresults/`)
2. Processes results through scoring algorithms (`calcscores.js`)
3. Caches calculated standings in memory (`leaguedata.js`)
4. Serves results via Express web server (`app.js`)

### Key Components
- **app.js** - Express server with REST API endpoints
- **leaguedata.js** - Cache management and data processing
- **calcscores.js** - Scoring calculations
- **admin.js** - Admin interface routes
- **protest.js** - Protest management system
- **register.js** - Driver registration

## Data Structure
Each league has a folder in `/data/{LEAGUEID}/` containing:
- `config.json` - League configuration
- `drivers.json` - Driver roster
- `rounds.json` - Race schedule
- `scoring.json` - Points system
- `classes.json` - Car classes
- `teams.json` - Team assignments
- `penalties.json` - Applied penalties
- `protests.json` - Filed protests
- `classtotals.json` - Calculated standings
- `irresults/` - Raw iRacing API results

## Web Interface
- **Main URL:** `/{leagueid}` → Shows standings tables
- **Results:** `/{leagueid}/results` → Race results viewer
- **Admin:** `/admin` → League configuration
- **Protests:** `/{leagueid}/protest` → Protest filing system
- **Registration:** `/{leagueid}/register` → Driver registration

## Key Features
- Multi-class racing support
- Team standings
- Penalty system
- Protest workflow
- Driver class changes mid-season
- CSV export capability
- Track map display

## File Structure
- Main code in root directory
- League data in `data/` folder
- Output results in `results/` subfolder
- Web interface files in `html/`, `img/`, `css/`, and `script/` folders

## Authentication

The admin interface is secured with Google OAuth 2.0 authentication. Only users with email addresses listed in `/data/{leagueid}/adminusers.json` can access admin features.

**Setup Instructions:** See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) for detailed configuration instructions.

**Quick Start:**
1. Copy `.env.example` to `.env`
2. Configure Google OAuth credentials in `.env`
3. Add authorized admin emails to `/data/{leagueid}/adminusers.json`
4. Access admin at `/admin/{leagueid}` (will redirect to login if not authenticated)

