import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	format: 'esm',
	outfile: 'dist/main.js',
	target: 'chrome64',
})

await esbuild.build({
	entryPoints: ['src/llm-worker.js'],
	bundle: true,
	format: 'esm',
	outfile: 'dist/llm-worker.js',
	target: 'chrome64',
})


const config = {
	entryPoints: ['src/main.ts'],
	bundle: true,
	format: 'esm',
	outfile: 'dist/main.js',
	target: 'chrome64',

	plugins: [{
		name: 'rebuild-notify',
		setup(build) {
			build.onEnd(result => {
				console.log(`build ended with ${result.errors.length} errors`);
				// HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
			})
		},
	}],
};

const run = async () => {
	const ctx = await esbuild.context(config);
	await ctx.watch();
};

run();
