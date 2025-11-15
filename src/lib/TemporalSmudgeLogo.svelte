<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { TimeShimmer } from './TimeShimmer';

  let canvas4Logo: HTMLCanvasElement;
  let canvas4Shimmer: HTMLCanvasElement;

  const width = 350;
  const height = 150;

  function drawLogo() {
    const ctx = canvas4Logo.getContext('2d');
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(1, 'white');
    const gradientReverse = ctx.createLinearGradient(width, 0, 0, 0);
    gradientReverse.addColorStop(0, 'black');
    gradientReverse.addColorStop(1, 'white');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = gradientReverse;
    ctx.fillRect(0, height / 2, width, height / 2);

    ctx.fontStretch = 'expanded';
    ctx.font = [height * 0.4 + 'px', 'Monospace'].join(' ');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = gradientReverse;
    ctx.fillText('TEMPORAL', width / 2, height / 4);
    // ctx.fillText('TEMPORAL', width / 2, 0);
    ctx.fillStyle = gradient;
    ctx.fillText('SMUDGING', width / 2, (3 * height) / 4);
    // ctx.fillText('SMUDGING', width / 2, height);
  }

  $effect(() => {
    drawLogo();
  });

  let timeShimmer: TimeShimmer;
  let animInterval: NodeJS.Timeout;
  onMount(() => {
    timeShimmer = new TimeShimmer(canvas4Logo, [canvas4Shimmer]);
    animInterval = setInterval(() => {
      drawLogo();
      timeShimmer.updateAndDraw();
    }, 15);
  });
  onDestroy(() => {
    clearInterval(animInterval);
  });
</script>

<div style="width: {width}px; height: {height}px; position:relative;">
  <canvas class="logo" bind:this={canvas4Logo} {width} {height}> </canvas>
  <canvas class="shimmer" bind:this={canvas4Shimmer} {width} {height}> </canvas>
</div>

<style>
  .logo,
  .shimmer {
    /* since I couldn't get fontStretch to work */
    transform: translate(+50%, 0) scale(2, 1);
  }

  .logo {
    background-color: blue;
  }
  .shimmer {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
