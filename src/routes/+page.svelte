<script lang="ts">
	import { goto } from "$app/navigation";

	let url = "";
	function onSubmit(e) {
		if (new URL(url)) {
			goto(`/threads/${url}`);
		}
	}
</script>

<svelte:head>
	<title>Mastodon Thread Unroller</title>
	<meta name="description" content="Mastodon Thread Unroller" />
</svelte:head>

<section class="h-full">
	<div class="max-w-lg w-full h-full m-auto flex flex-col justify-center">
		<div>
			<form on:submit|preventDefault={onSubmit}>
				<label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only"
					>Mastodon post URL</label
				>
				<div class="relative">
					<input
						type="search"
						id="default-search"
						class="block p-4 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Mastodon post URL..."
						bind:value={url}
						required
					/>
					<button
						type="submit"
						class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
						>Unroll!</button
					>
				</div>
			</form>
		</div>
	</div>
</section>

<style>
	section {
		height: 80vh;
	}
</style>
