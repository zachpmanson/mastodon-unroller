<script>
	import Header from "./Header.svelte";
	import "./styles.css";
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>
</div>
