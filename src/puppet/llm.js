import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

let engine = null

export async function llm_load(callback) {
	engine = await CreateWebWorkerMLCEngine(
		new Worker(`${import.meta.url}/../llm-worker.js`, { type: "module" }),
		selectedModel,
		{ initProgressCallback: callback },
	)
	console.log("... web-llm engine loaded")
}

export async function llm_invoke(request,callback) {
	if(!engine) return
	const asyncChunkGenerator = await engine.chat.completions.create(request);
	for await (const chunk of asyncChunkGenerator) {
		if(!chunk.choices || !chunk.choices.length || !chunk.choices[0].delta) continue
		const fragment = chunk.choices[0].delta.content || ""
		callback({request,fragment})
	}
	const message = await engine.getMessage()
	callback({message})
}

export function llm_stop() {
	if(!engine || !engine.interruptGenerate) return
	return engine.interruptGenerate()	
}