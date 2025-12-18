<script lang="ts">
  import { base } from '$app/paths';


</script>

<div>Source Video</div>

<!-- svelte-ignore a11y_media_has_caption -->
<video class="wide" controls playsinline src={base + "/example_videos/Arteles-Pepper/Arteles-Pepper-2025-11-17-07.04.mov"}>
</video> 

<br/>
<br/>

<div>“I want a frame where I’m looking at the pedestal and it’s empty”</div>

<div>Old-school photoshopping does this by feathering edges.</div>

<div>How To Feather in GIMP</div>
<ol>
    <li>right click your layer</li>
    <li>alpha to selection</li>
    <li>Select: shrink 8</li>
    <li>Select: feather 8</li>
    <li>Select: invert</li>
    <li>Edit: Clear</li>
</ol>
    
<div>You now have a selected layer with feathered edges</div>

<!-- svelte-ignore a11y_missing_attribute -->
<img class="wide" src={ base + "/example_videos/Arteles-Pepper/Screenshot 2025-12-17 at 19.13.44.png" }/>

<style>
    .wide {
        width:100%;
    }
</style>
