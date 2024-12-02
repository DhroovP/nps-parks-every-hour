import fetch from "node-fetch";
import dotenv from "dotenv";
import express from "express";
import http  from 'http';
import { resize } from "./references/helpers.js";
import { getNationalParks, getNationalRecAreas } from "./references/get_nps_sites.js"

dotenv.config()

const BING_API_KEY = process.env.BING_API_KEY
const BLUESKY_AUTH_URL = "https://bsky.social/xrpc/com.atproto.server.createSession";
const BLUESKY_API_URL = "https://bsky.social/xrpc/com.atproto.repo.createRecord";
const BLUESKY_HANDLE = "npsunitshourly.bsky.social";
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD

function generateRandomSearchTerm(allNationalParks: Array<Map<string, string>>, allRecSites: Array<Map<string, string>>) {
  const allSites = [...allNationalParks, ...allRecSites];
  const randomIndex = Math.floor(Math.random() * allSites.length);
  return allSites[randomIndex];
}

async function fetchPlacePhoto(site: Map<string, string>) {
  const siteName: string = site.get('name') + ' ' + site.get('location')

  const bingUrl = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(
    siteName
  )}&count=1&mkt=en-US`;
  const bingResponse = await fetch(bingUrl, {
    headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY! },
  });
  const bingData: any = await bingResponse.json();

  if (bingData.value.length === 0) {
    throw new Error(`No images found for: ${siteName}`);
  }

  const image = bingData.value[0];
  return {
    image_url: image.contentUrl,
    description: image.name,
  };
}

async function authenticateBluesky() {
  const response = await fetch(BLUESKY_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: BLUESKY_HANDLE,
      password: BLUESKY_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Bluesky Authentication Error: ${response.statusText}`);
  }

  const data:any = await response.json();
  return data.accessJwt;
}

async function uploadImageToBluesky(imageUrl: any, accessToken: any) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  
  const resizedBuffer: ArrayBuffer = await resize(imageBuffer)
  

  const blobResponse = await fetch(
    "https://bsky.social/xrpc/com.atproto.repo.uploadBlob",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
      },
      body: Buffer.from(resizedBuffer),
    }
  );

  if (!blobResponse.ok) {
    const errorDetails: any= await blobResponse.json();
    throw new Error(
      `Bluesky Image Upload Error: ${errorDetails.error || blobResponse.statusText}`
    );
  }

  const blobData:any = await blobResponse.json();
  return blobData.blob;
}

async function postToBluesky(imageData: any, site: Map<string, string>) {
  const accessToken = await authenticateBluesky();

  const imageBlob = await uploadImageToBluesky(imageData.image_url, accessToken);

  const postData = {
    collection: "app.bsky.feed.post",
    repo: BLUESKY_HANDLE,
    record: {
      $type: "app.bsky.feed.post",
      text: `${site.get('name')}\n${site.get('location')}`,
      createdAt: new Date().toISOString(),
      embed: {
        $type: "app.bsky.embed.images",
        images: [{ image: imageBlob, alt: imageData.description }],
      },
    },
  };

  const response = await fetch(BLUESKY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorDetails:any = await response.json();
    throw new Error(`Bluesky Post Error: ${errorDetails.error || response.statusText}`);
  }

  console.log("Post successful!");
}


async function wait() {
  console.log('Waiting an hour before posting again...')
  return new Promise((resolve) => setTimeout(resolve, 3600000)); 
}

async function main() {
  console.log('Updating list of national parks, forests, monuments, and recreation areas...');
  const allNationalParks: Array<Map<string, string>> = await getNationalParks();
  const allRecSites: Array<Map<string, string>>  = await getNationalRecAreas();
  
  while (true) {
    console.log('Picking random site...');
    const site: Map<string, string> = generateRandomSearchTerm(allNationalParks, allRecSites);

    console.log('Fetching place photo...');
    const imageData = await fetchPlacePhoto(site);

    console.log('Posting to BlueSky...');
    await postToBluesky(imageData, site);
    await wait()
  }
}
const app = express();
const port = process.env.PORT || 8080; 

http.createServer((_: any, res: any) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running.\n');
}).listen(port, () => {
  console.log(`Health check server running on port ${port}`);
});

main();
