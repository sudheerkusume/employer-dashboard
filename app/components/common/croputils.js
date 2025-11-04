import { createImage, getRadianAngle, rotateSize } from "./imagehelpers";

/**
 * Get a cropped image Blob from a source image URL
 * @param {string} imageSrc - Image URL or base64 string
 * @param {Object} pixelCrop - Cropped area pixels from react-easy-crop
 * @param {number} rotation - Rotation angle in degrees
 * @returns {Promise<Blob>} - Cropped image blob
 */
export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rotRad = getRadianAngle(rotation);

    // Calculate rotated bounding box
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // Set canvas size to fit rotated image
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Move origin to center for rotation
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.rotate(-rotRad);
    ctx.translate(-bBoxWidth / 2, -bBoxHeight / 2);

    // Extract cropped area
    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

    // Create final canvas with cropped area
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = pixelCrop.width;
    cropCanvas.height = pixelCrop.height;
    const cropCtx = cropCanvas.getContext("2d");
    cropCtx.putImageData(data, 0, 0);

    // Convert to Blob
    return new Promise((resolve) => {
        cropCanvas.toBlob(
            (blob) => {
                resolve(blob);
            },
            "image/jpeg",
            1
        );
    });
};
