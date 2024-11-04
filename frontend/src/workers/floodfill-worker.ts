self.onmessage = function (e) {
    console.log("floodfill-worker", e);
    const { imageData, width, height, x, y, targetColor, fillColor } = e.data;

    const data = new Uint8ClampedArray(imageData);
    const targetHexColor = targetColor;
    if (targetHexColor === fillColor) return; // Prevent filling if the color is the same

    const stack = [[x, y]];
    const processedPixels = new Set();

    const getPixelColor = (data: Uint8ClampedArray, width: number, x: number, y: number) => {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    while (stack.length) {
        const [px, py] = stack.pop()!;
        const index = (py * width + px) * 4;

        if (processedPixels.has(`${px},${py}`)) continue; // Skip already processed pixels
        processedPixels.add(`${px},${py}`); // Mark this pixel as processed

        if (getPixelColor(data, width, px, py) === targetHexColor) {
            // Change color
            data[index] = parseInt(fillColor.slice(1, 3), 16); // R
            data[index + 1] = parseInt(fillColor.slice(3, 5), 16); // G
            data[index + 2] = parseInt(fillColor.slice(5, 7), 16); // B
            data[index + 3] = 255; // A

            // Push neighboring pixels to stack
            if (px + 1 < width) stack.push([px + 1, py]);
            if (px - 1 >= 0) stack.push([px - 1, py]);
            if (py + 1 < height) stack.push([px, py + 1]);
            if (py - 1 >= 0) stack.push([px, py - 1]);
        }
    }

    console.log("floodfill-worker done", data);
    self.postMessage(data); // Send the modified image data back to the main thread
};