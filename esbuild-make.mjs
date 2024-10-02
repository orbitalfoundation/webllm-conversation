import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
})

await esbuild.build({
  entryPoints: ['src/puppet/llm-worker.js'],
  bundle: true,
  outfile: 'dist/llm-worker.js',
})
