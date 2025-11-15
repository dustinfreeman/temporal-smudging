<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { TimeShimmer } from '$lib/TimeShimmer';
  import { sampleFromCanvasAndVideoInTime } from '$lib/frameTimeSampler';
  import TemporalSmudgeLogo from '$lib/TemporalSmudgeLogo.svelte';
  import { Vec2 } from '$lib/vec2';

  const frameCache: ImageData[] = [];
  let videoCachingFinished = $state(false);

  let video: HTMLVideoElement;
  let canvas4Caching: HTMLCanvasElement;
  let canvas4SolidVideoTimeGray: HTMLCanvasElement;
  let canvas4SmudgeOutput: HTMLCanvasElement;
  let canvas4Painting: HTMLCanvasElement;
  let co1: HTMLCanvasElement | undefined = $state(undefined);
  let co2: HTMLCanvasElement | undefined = $state(undefined);
  let canvi4OverlayShimmering: (HTMLCanvasElement | undefined)[] = $derived([co1, co2]);

  const cSCALE = 1 / 5;
  //HACK: is this assumption broken?
  // const CW = 1620 * cSCALE;
  const CW = 1920 * cSCALE;
  const CH = 1080 * cSCALE;

  const exampleVideoFolder = base + '/example_videos/'
  const defaultVideoSrc = exampleVideoFolder + 'WIN_20250614_19_54_33_Pro.mp4';
  // 'D-Photobooth-2025-06-10-17.44.mov';

  let videoSrc = $state(defaultVideoSrc);
  let fileinput: HTMLInputElement;
  function onVideoSelected(e: any) {
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = (e) => {
      let result = (e!.target!.result as string) ?? '';
      videoSrc = result;
      //reset video cache
      frameCache.length = 0;
      videoCachingFinished = false;
      video.play();
    };
  }

  const MouseModes = [
    'Paint This',
    'Eyedropper',
    'Darken',
    'Lighten',
    'Smudge',
    'Load Video' //This isn't a mode, and I'm sorry
  ] as const;
  const MMMoji = ['💅', '🔎', '🌘', '🌔', '👅', '🗃️'];
  type MouseMode = (typeof MouseModes)[number];
  let currentMouseMode: MouseMode = $state('Paint This');

  function makeGray(grayShade: number) {
    return `rgb(${grayShade}, ${grayShade}, ${grayShade})`;
  }

  let videoPlaybackFrac = $state(0.0);
  let temporalOffsetMode = $state(false);

  $effect(() => {
    console.log('video?', video);
    video?.requestVideoFrameCallback(drawOnVideoDupCanvas);
  });
  const drawOnVideoDupCanvas = (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => {
    const ctxCaching = canvas4Caching?.getContext('2d');
    const ctxGray = canvas4SolidVideoTimeGray?.getContext('2d');
    if (!(ctxCaching && ctxGray && video)) {
      return;
    }

    if (!videoCachingFinished) {
      video.playbackRate = 2.0; //somehow frame cache count is (nearly) the same size regardless of playback rate, yay!
      ctxCaching.drawImage(video, 0, 0, CW, CH);
      let frame = ctxCaching.getImageData(0, 0, CW, CH);
      frameCache.push(frame);
    } else {
      video.playbackRate = 1.0;
    }
    // console.log(video.currentTime, video.duration, video.currentTime / video.duration);
    if (video.duration >= 0) {
      videoPlaybackFrac = video.currentTime / video.duration;
      ctxGray.fillStyle = makeGray(videoPlaybackFrac * 255);
      ctxGray.fillRect(0, 0, CW, CH);
    }

    video?.requestVideoFrameCallback(drawOnVideoDupCanvas);
  };

  let brushRadius = $state(30);
  let currentPaintGray: number = $state(128);
  let lastMousePos: Vec2 | undefined;
  let mousePos: Vec2 | undefined = $state(undefined);
  const onPaintingCanvasMouseMove = (e: any) => {
    let ctx = canvas4Painting.getContext('2d');
    //HACK: something fucked up with the mouse coordinate system here, which I "fixed" with cursor:none;
    mousePos = new Vec2(e.offsetX, e.offsetY);
    if (lastMousePos && ctx && e.buttons === 1) {
      const smudgeDelta = mousePos.subtract(lastMousePos);
      let prevGrayLUT = ctx.getImageData(0, 0, CW, CH);
      if (currentMouseMode === 'Paint This') {
        ctx.strokeStyle = '';
        ctx.fillStyle = makeGray(currentPaintGray);
        ctx.lineWidth = brushRadius;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, brushRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (['Darken', 'Lighten'].includes(currentMouseMode)) {
        const changeStep = 1 * (currentMouseMode === 'Lighten' ? +1 : -1);
        for (let x = 0; x < CW; x++) {
          for (let y = 0; y < CH; y++) {
            const pt = new Vec2(x, y);
            if (mousePos.subtract(pt).magnitude() < brushRadius) {
              const p = 4 * (x + y * CW);
              for (let c = 0; c < 3; c++) {
                prevGrayLUT.data[p + c] = Math.max(
                  0,
                  Math.min(255, prevGrayLUT.data[p + c] + changeStep)
                );
              }
              prevGrayLUT.data[p + 3] = 255; //opaque
            }
          }
        }
        ctx.putImageData(prevGrayLUT, 0, 0);
        // const prevGray = prevGrayLUT.data[4 * mousePos.x + mousePos.y * CW];
        // const grayToPaint = Math.max(
        //   0,
        //   Math.min(255, prevGray + changeStep
        // );
        // console.log(mousePos, 'gray', prevGray, grayToPaint);
        // ctx.strokeStyle = '';
        // ctx.fillStyle = makeGray(grayToPaint);
        // ctx.lineWidth = brushRadius;
        // ctx.beginPath();
        // ctx.arc(mousePos.x, mousePos.y, brushRadius, 0, 2 * Math.PI);
        // ctx.fill();
      }
      if (currentMouseMode === 'Eyedropper') {
        currentPaintGray = prevGrayLUT.data[4 * mousePos.x + mousePos.y * CW];
      }
      if (currentMouseMode === 'Smudge') {
        const smudgeStrength = 0.3;
        // console.log('smudge?', mousePos, smudgeDelta);
        for (let x = 0; x < CW; x++) {
          for (let y = 0; y < CH; y++) {
            const pt = new Vec2(x, y);
            const p = 4 * (x + y * CW);
            const pPreDelta = 4 * (x - smudgeDelta.x + (y - smudgeDelta.y) * CW);
            if (
              mousePos.subtract(pt).magnitude() < brushRadius &&
              0 <= pPreDelta &&
              pPreDelta <= 4 * CW * CH
            ) {
              const paintThisGray = Math.floor(
                prevGrayLUT.data[p + 0] * (1 - smudgeStrength) +
                  prevGrayLUT.data[pPreDelta + 0] * smudgeStrength
              );
              for (let c = 0; c < 3; c++) {
                prevGrayLUT.data[p + c] = paintThisGray;
              }
              prevGrayLUT.data[p + 3] = 255; //opaque
            }
          }
        }
        ctx.putImageData(prevGrayLUT, 0, 0);
      }
    }
    lastMousePos = mousePos;
  };
  function onPaintingCanvasMouseWheel(e: any) {
    brushRadius = Math.min(Math.max(1, brushRadius + e.deltaY * 0.02), 150);
  }

  function mouseHoverScrub(normPos: Vec2, ctx: CanvasRenderingContext2D) {
    try {
      const frameForward = frameCache[Math.floor(normPos.x * frameCache.length)];
      const frameBackward = frameCache[Math.floor((1 - normPos.y) * frameCache.length)];
      for (let x = 0; x < CW; x++) {
        for (let y = 0; y < CH; y++) {
          const p = 4 * (x + y * CW);
          if (y / CH > 0.5) {
            for (let c = 0; c < 4; c++) {
              frameForward.data[p + c] = frameBackward.data[p + c];
            }
          }
        }
      }
      ctx.putImageData(frameForward, 0, 0);
    } catch {}
  }

  let timeShimmer: TimeShimmer;
  let showShimmer = $state(true);
  let animInterval: NodeJS.Timeout;
  onMount(() => {
    timeShimmer = new TimeShimmer(canvas4Painting, canvi4OverlayShimmering, {width: 60});
    animInterval = setInterval(() => {
      timeShimmer.updateAndDraw(showShimmer);
      sampleFromCanvasAndVideoInTime(
        canvas4Painting,
        canvas4SmudgeOutput,
        frameCache,
        temporalOffsetMode ? videoPlaybackFrac : 0
      );
    }, 15);
  });
  onDestroy(() => {
    clearInterval(animInterval);
  });

  function modeClick(mouseMode: MouseMode) {
    if (mouseMode === 'Load Video') {
      fileinput.click();
      return;
    }
    currentMouseMode = mouseMode;
  }
</script>

<TemporalSmudgeLogo />

<div class="ui_container">
  <div class="video_column">
    <div class="header_video_canvas">Video Source</div>
    <!-- 1620 x 1080 HACK: double check -->
    <video
      src={videoSrc}
      class="video_embed"
      style="aspect-ratio: {CW / CH};"
      autoplay
      playsinline
      muted
      controls
      bind:this={video}
      onended={() => {
        if (!videoCachingFinished) {
          console.log(`video playthrough ended; framecache size: ${frameCache.length}`);
          // console.log('video: restarting loop...');
        }
        videoCachingFinished = true;
        video.play();
      }}
    ></video>
    <div class="header_video_canvas">Video Source sampled from smudged time</div>
    <div class="video_box">
      <canvas
        width={CW}
        height={CH}
        class="canvas"
        bind:this={canvas4SmudgeOutput}
        onmousemove={(e) => {
          const xFrac = e.offsetX / CW;
          const ctx = canvas4SmudgeOutput.getContext('2d');
          if (ctx) {
            // mouseHoverScrub(new Vec2(e.offsetX / CW, e.offsetY / CH), ctx);
          }
        }}
      ></canvas>
      <canvas width={CW} height={CH} class="canvas_as_overlay" bind:this={co2}> </canvas>
    </div>
  </div>
  <div class="video_column">
    <div class="header_video_canvas">Time-per-pixel in Source</div>
    <canvas
      bind:this={canvas4SolidVideoTimeGray}
      width={CW}
      height={CH}
      class="canvas"
      onclick={() => {
        if (currentMouseMode === 'Eyedropper') {
          currentPaintGray = videoPlaybackFrac * 255;
        }
      }}
    ></canvas>
    <div class="header_video_canvas">Here is where you Smudge Time</div>
    <div class="video_box" style="cursor:none;">
      <canvas
        class="canvas_w_overlay"
        width={CW}
        height={CH}
        onmousemove={onPaintingCanvasMouseMove}
        onwheel={onPaintingCanvasMouseWheel}
        onmouseleave={() => {
          mousePos = undefined;
        }}
        bind:this={canvas4Painting}
      ></canvas>
      <canvas width={CW} height={CH} class="canvas_as_overlay" bind:this={co1}> </canvas>
      <svg class="svg_parent" viewBox="0 0 {CW} {CH}" xmlns="http://www.w3.org/2000/svg">
        {#if mousePos}
          <circle
            cx={mousePos.x}
            cy={mousePos.y}
            r={brushRadius}
            stroke={'#00f6'}
            stroke-width={CW * 0.009}
            fill="#0000"
          />
        {/if}
      </svg>
    </div>
  </div>
  <div class="video_column palette">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      style="background-color: {makeGray(currentPaintGray)};"
      class="inactive"
      title="Current Paint Gray"
    ></button>
    {#each MouseModes as mouseMode}
      <button
        class={currentMouseMode === mouseMode ? 'button_mode_on' : 'palette_button'}
        title={mouseMode}
        onclick={() => {
          modeClick(mouseMode);
        }}>{MMMoji[MouseModes.indexOf(mouseMode)]}</button
      >
    {/each}
  </div>
</div>

<canvas bind:this={canvas4Caching} width={CW} height={CH} class="hidden_canvas"></canvas>

<input
  style="display:none"
  type="file"
  accept="video/*"
  onchange={(e) => onVideoSelected(e)}
  bind:this={fileinput}
/>

<div>
  <label for="shimmerCheck">Time Shimmer</label>
  <input type="checkbox" id="shimmerCheck" bind:checked={showShimmer} />
</div>
<div>
  <label for="temporalOffsetCheck">Temporal Offset Mode?</label>
  <input type="checkbox" id="temporalOffsetCheck" bind:checked={temporalOffsetMode} />
</div>

<div>
  Source code <a href="https://github.com/dustinfreeman/temporal-smudging">here</a>
</div>

<style>
  .ui_container {
    display: flex;
  }

  .video_column {
    display: flex;
    flex-direction: column;
  }

  .video_box,
  .canvas,
  .video_embed {
    /* width: 350px; */
    height: 200px;
  }

  .video_embed {
    overflow: clip;
    /* TODO: uncomment to drop video controls below video so it doesn't overlap */
    /* just assuming height of the controls here */
    /* height:calc(200px + 100px); */
    /* margin-top: -50px;  */
  }

  .video_box {
    overflow: clip;
    position: relative;
  }
  .canvas,
  .canvas_w_overlay {
    background-color: #a00a;
  }

  .canvas_w_overlay,
  .canvas_as_overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #a000;
  }
  .canvas_as_overlay {
    pointer-events: none;
    background-color: transparent;
  }

  .hidden_canvas {
    display: none;
  }

  .header_video_canvas {
    text-decoration: underline;
  }

  .palette {
    flex-direction: column-reverse;
  }

  .button_mode_on,
  .palette_button,
  .inactive {
    width: 50px;
    aspect-ratio: 1;
    background-color: darkviolet;
    font-size: large;
  }

  .button_mode_on {
    background-color: violet;
  }

  .inactive {
    pointer-events: none;
    border-color: #44a;
    border-style: solid;
    border-width: 4px;
    border-radius: 3px;
  }

  .svg_parent {
    position: absolute; /*required to make z-index work?*/
    z-index: 10;
    pointer-events: none;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
</style>
