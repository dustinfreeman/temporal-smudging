
export function sampleFromCanvasAndVideoInTime(canvas4Painting: HTMLCanvasElement, canvas4SmudgeOutput: HTMLCanvasElement, frameCache: ImageData[], offsetFrac = 0) {
    //expects everything to have the same height and width

    const ctxLUT = canvas4Painting.getContext('2d');
    const ctxVideo = canvas4SmudgeOutput.getContext('2d');
    if (!(ctxLUT && ctxVideo && frameCache.length > 0)) {
        return;
    }

    const lut = ctxLUT.getImageData(0, 0, canvas4Painting.width, canvas4Painting.height);
    const frame: ImageData = frameCache[0]; // I guess we can copy like this?

    for (let x = 0; x < canvas4Painting.width; x++) {
        for (let y = 0; y < canvas4Painting.height; y++) {
            const p = 4 * (x + y * canvas4Painting.width);
            const frac = (lut.data[p + 0] / 255.0 + offsetFrac) % 1;
            const lutIndex = Math.min(
                Math.floor(frac * frameCache.length),
                frameCache.length - 1
            );
            if (!frameCache.at(lutIndex)) {
                console.warn(
                    `couldnt get framecache at index ${lutIndex}, only have ${frameCache.length}`
                );
                continue;
            }
            if (p + 0 > frameCache[lutIndex].data.length) {
                console.warn(
                    `somehow our data array is too small? ${frameCache[lutIndex].data.length} {p}`
                );
                continue;
            }
            for (let c = 0; c < 4; c++) {
                frame.data[p + c] = frameCache[lutIndex].data[p + c];
            }
        }
    }

    ctxVideo.putImageData(frame, 0, 0);
}