import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	format: 'esm',
	outfile: 'dist/main.js',
	target: 'chrome64',
})

await esbuild.build({
	entryPoints: ['src/puppet/llm-worker.js'],
	bundle: true,
	format: 'esm',
	outfile: 'dist/llm-worker.js',
	target: 'chrome64',
})
