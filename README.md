# **Federal Lands Every Hour Bot**

This bot posts a random site from U.S. national parks, forests, monuments, and recreation areas hourly to [Bluesky](https://bsky.app). 

[@npsunitshourly.bsky.social](https://bsky.app/profile/npsunitshourly.bsky.social)

The bot fetches site data using the National Park Service and Recreation.gov APIs and retrieves images via Bing Image Search.


## **Prerequisites**
1. **APIs**:
   - National Park Service API ([Sign up](https://www.nps.gov/subjects/developer/get-started.htm)).
   - Recreation.gov API ([Sign up](https://ridb.recreation.gov/)).
   - Bing Image Search API ([Sign up](https://learn.microsoft.com/en-us/bing/search-apis/bing-image-search/overview)).

2. **Environment Variables**:
   Create a `.env` file with the following variables:
   ```plaintext
   BING_API_KEY=<your-bing-api-key>
   BLUESKY_PASSWORD=<your-bluesky-password>
   NPS_API_KEY=<your-nps-api-key>
   RECREATION_GOV_API_KEY=<your-recreation-gov-api-key>

3. **Docker**

## Running

### Terminal
`npm install`
`npx tsc`
`node dist/bot.js`

### Docker
`docker build -t <image-name> .`
`docker run -it <image-name>`

## Project Structure

```
nps-parks-bot/
├── dist/                   # Compiled JavaScript output
├── src/                    # Source TypeScript files
│   ├── bot.ts              # Main entry point
│   ├── references/         # Helper modules
│   │   ├── get_nps_sites.ts # Fetch site data from APIs
│   │   ├── helpers.ts       # Image resizing and compression
│   └── Dockerfile          # Docker container setup
├── .env                    # Environment variables
├── package.json            # Node.js project configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Documentation
```

## TODO

- Remove `any` types
- Post three images instead of one
- Update the exclusion list to filter out additional non-relevant federal lands
- Refactor bot.ts to act as a main entry point, moving logic away
- Include .gov links in posts