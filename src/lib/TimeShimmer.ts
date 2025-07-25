export class TimeShimmer {
    getCanvas: HTMLCanvasElement;
    drawCanvi: (HTMLCanvasElement | undefined)[];
    public shimmerWidth;
    protected shimmerDirn = 1;
    protected targetShimmerGray = 200;

    constructor(getCanvas: HTMLCanvasElement, drawCanvi?: (HTMLCanvasElement | undefined)[], shimmerWidth = 30) {
        this.getCanvas = getCanvas;
        this.drawCanvi = drawCanvi ?? [getCanvas];
        this.shimmerWidth = shimmerWidth;
    }

    protected _update() {
        this.targetShimmerGray += this.shimmerDirn * 2;
        if (this.targetShimmerGray > 255) {
            // this.shimmerDirn = -1;
            //no bounce
            this.targetShimmerGray = 0;
        }
        if (this.targetShimmerGray < 0) {
            this.shimmerDirn = +1;
        }
    }

    protected _draw(show = true) {
        const getCtx = this.getCanvas.getContext('2d');
        if (!(getCtx && show)) {
            return;
        }
        //HACK: expect dims to be identical, without checking
        const width = this.getCanvas.width;
        const height = this.getCanvas.height;
        const getImg = getCtx.getImageData(0, 0, width, height);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const p = 4 * (x + y * width);
                const currentGray = getImg.data[p + 0];
                //Math.pow used to sharpen, to near Dirac-Delta levels. Lower = sharper
                const targetDist = Math.pow(Math.abs(this.targetShimmerGray - currentGray) / this.shimmerWidth, 0.3);
                if (targetDist <= 1) {
                    getImg.data[p + 0] = 255 * (1 - targetDist) + getImg.data[p + 0] * targetDist;
                    getImg.data[p + 1] = 0 + getImg.data[p + 1] * targetDist;
                    getImg.data[p + 2] = 0 + getImg.data[p + 2] * targetDist;
                    getImg.data[p + 3] = 255 * (1 - targetDist);
                } else {
                    getImg.data[p + 3] = 0; //force transparent
                }
            }
        }
        for (const c of this.drawCanvi) {
            const drawCtx = c?.getContext('2d');
            drawCtx?.putImageData(getImg, 0, 0);
        }
    }

    updateAndDraw(show = true) {
        this._update();
        this._draw(show);
    }
}