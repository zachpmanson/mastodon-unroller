<script>
	import { page } from "$app/stores";
</script>

<div class="max-w-lg m-auto text-center">
	{#if $page.status === 404}
		Couldn't find thread
	{:else}
		{$page.status} {$page.error.message}
	{/if}
</div>
