import sharp from "sharp";

async function resize(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  let resizedBuffer = imageBuffer;
  let quality = 90; 
  let width = 1920;
  let height;

  while (resizedBuffer.byteLength > 1000000) { // 1 MB size limit
    const metadata = await sharp(imageBuffer).metadata();
    
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      width = Math.floor(width * 0.9); // reduce width by 10%
      height = Math.floor(width / aspectRatio);
    }

    resizedBuffer = await sharp(imageBuffer)
      .resize({ width, height }) 
      .jpeg({ quality, chromaSubsampling: '4:4:4' }) // chroma subsampling?
      .toBuffer();

    quality -= 5; 
    if (quality < 30) { // minimum acceptable quality
      throw new Error("Unable to compress image under 1 MB");
    }
  }

  return resizedBuffer;
}

export { resize };
