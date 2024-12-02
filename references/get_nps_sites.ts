import dotenv from "dotenv";

dotenv.config();

const NPS_BASE_URL = "https://developer.nps.gov/api/v1";
const RECREATION_GOV_BASE_URL = "https://ridb.recreation.gov/api/v1";
const RECREATION_GOV_API_KEY = process.env.RECREATION_GOV_API_KEY;
const NPS_API_KEY = process.env.NPS_API_KEY;

const SITE_EXCLUSIONS = [
    "Field Office",
    "Trail",
    "Visitor Center",
    "Easement"
]


async function getNationalParks(): Promise<Array<Map<string, string>>> {
    let offset = 0;
    let remaining = 1; 
    const limit = 50;
    const allParks: Array<Map<string, string>> = new Array<Map<string, string>>();
  
    while (remaining > 0) {
      try {
        const response = await fetch(
          `${NPS_BASE_URL}/parks?api_key=${NPS_API_KEY}&limit=${limit}&start=${offset}`
        );
  
        if (!response.ok) {
          throw new Error(`Failed to fetch parks data: ${response.statusText}`);
        }
  
        const data = await response.json();

        for (let i = 0; i < data.data.length; i++) {
            const parkName: string = data.data[i].fullName;
            if (parkName.includes("National Park")) {
                const siteCity: string = data.data[i].addresses[0].city || "Unknown City";
                const siteState: string = data.data[i].addresses[0].stateCode || "Unknown State";
                const siteCityState: string = `${siteCity}, ${siteState}`;
        
                const siteInfo = new Map<string, string>();
                siteInfo.set("name", parkName);
                siteInfo.set("location", siteCityState);
        
                allParks.push(siteInfo);
            }
        }

        offset += limit;
        remaining = data.total - offset;
  
        console.log(`Fetched ${allParks.length} parks so far...`);
      } catch (error) {
        console.error("Error fetching parks:", error);
        throw error; 
      }
    }
  
    console.log(`Fetched a total of ${allParks.length} parks.`);
    return allParks; 
}


async function getNationalRecAreas(): Promise<Array<Map<string, string>>> {

    let offset = 0;
    let remaining = 1; 
    const limit = 50;
    const allAreas: Array<Map<string, string>> = new Array<Map<string, string>>();
  
    while (remaining > 0) {
      try {
        const response = await fetch(
          `${RECREATION_GOV_BASE_URL}/recareas?limit=${limit}&offset=${offset}&full=true`,
          {
            headers: {
                'apikey': RECREATION_GOV_API_KEY!
            }
          });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch areas data: ${response.statusText}`);
        }
  
        const data = await response.json();

        for (let i = 0; i < data.RECDATA.length; i++) {
            const siteName: string = data.RECDATA[i].RecAreaName;
            if (SITE_EXCLUSIONS.some(exclusion => siteName.includes(exclusion))) {
                continue;
            }
            const siteCity: string = data.RECDATA[i]?.RECAREAADDRESS?.[0]?.City || "Unknown City";
            const siteState: string = data.RECDATA[i]?.RECAREAADDRESS?.[0]?.AddressStateCode || "Unknown State";
            const siteCityState: string = `${siteCity}, ${siteState}`;
    
            const siteInfo = new Map<string, string>();
            siteInfo.set("name", siteName);
            siteInfo.set("location", siteCityState);
    
            allAreas.push(siteInfo);
        }

        offset += limit;
        remaining = data.METADATA.RESULTS.TOTAL_COUNT - offset;
  
        console.log(`Fetched ${allAreas.length} rec areas, monuments, and forests so far...`);
     } catch (error) {
        console.error("Error fetching areas:", error);
        throw error; 
      }
    }
  
    console.log(`Fetched a total of ${allAreas.length} areas.`);
    return allAreas; 
}

export { getNationalParks, getNationalRecAreas };
  