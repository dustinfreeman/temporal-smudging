/**
 * @class TimeShimmer
 * Given an input canvas, draws a tint to multiple output canvi.
 * The amount of tint is based on how close pixels in the input canvas are
 *  to a target pixel colour. By animating this target colour between black and white, this creates a shimmer effect.
 * This assumes the input canvas is greyscale.
 * The default way of using this is that the output canvas is overlaid directly on top of the input canvas. Due to how transparency works between canvas elements in the DOM, this requires some non-intuitive blending methods. See the "applying the tint" for loop.
*/
export class TimeShimmer {
    inputCanvas: HTMLCanvasElement;
    outputCanvi: (HTMLCanvasElement | undefined)[];

    public props: ShimmerProps;
    protected defaultProps: ShimmerProps = {
        width: 30,
        tint: [255, 0, 0],
        dirn: 1,
        targetGrey: 200
    };

    constructor(getCanvas: HTMLCanvasElement, drawCanvi?: (HTMLCanvasElement | undefined)[], props? : Partial<ShimmerProps>) {
        this.inputCanvas = getCanvas;
        this.outputCanvi = drawCanvi ?? [getCanvas];
        this.props = {...this.defaultProps, ...props};
    }

    protected _update() {
        this.props.targetGrey += this.props.dirn * 2;
        if (this.props.targetGrey > 255) {
            // this.props.dirn = -1;
            //no bounce
            this.props.targetGrey = 0;
        }
        if (this.props.targetGrey < 0) {
            this.props.dirn = +1;
        }
    }

    protected _draw(show = true) {
        const getCtx = this.inputCanvas.getContext('2d');
        if (!(getCtx && show)) {
            return;
        }
        //HACK: expect dims to be identical, without checking
        const width = this.inputCanvas.width;
        const height = this.inputCanvas.height;
        const getImg = getCtx.getImageData(0, 0, width, height);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const p = 4 * (x + y * width);
                const currentGray = getImg.data[p + 0];
                //Math.pow used to sharpen, to near Dirac-Delta levels. Lower = sharper
                const distToTarget = Math.pow(Math.abs(this.props.targetGrey - currentGray) / this.props.width, 0.3);
                if (distToTarget <= 1) {
                    //applying the tint
                    for (let c=0; c<3; c++) {
                        getImg.data[p + c] = 
                            this.props.tint[c] * (1 - distToTarget) + 
                            getImg.data[p + 0] * distToTarget;
                    }
                    getImg.data[p + 3] = 255 * (1 - distToTarget);
                } else {
                    getImg.data[p + 3] = 0; //force transparent
                }
            }
        }
        for (const c of this.outputCanvi) {
            const drawCtx = c?.getContext('2d');
            drawCtx?.putImageData(getImg, 0, 0);
        }
    }

    updateAndDraw(show = true) {
        this._update();
        this._draw(show);
    }
}

interface ShimmerProps {
    width: number;
    tint: number[];
    dirn: number;
    targetGrey: number;
}
