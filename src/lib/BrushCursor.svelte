<script lang="ts">
    import type { Vec2 } from "./vec2";

    let {
        centroid,
        radius,
        CW, CH
    } : {centroid?: Vec2, radius: number, CW: number, CH: number} = $props();
</script>

<svg class="svg_parent" viewBox="0 0 {CW} {CH}" xmlns="http://www.w3.org/2000/svg">
    {#if centroid}
        <circle
        cx={centroid.x}
        cy={centroid.y}
        r={radius}
        stroke={'#00f6'}
        stroke-width={CW * 0.009}
        fill="#0000"
        />
    {/if}
</svg>

<style>
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
