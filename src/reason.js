
const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

let engine = null

export async function reason_load(callback) {
	engine = await CreateWebWorkerMLCEngine(
		new Worker(`${import.meta.url}/../llm-worker.js`, { type: "module" }),
		selectedModel,
		{ initProgressCallback: callback },
	)
	console.log("... web-llm engine loaded")
}

export function reason_stop() {
	if(!engine || !engine.interruptGenerate) return
	return engine.interruptGenerate()	
}

export async function reason(request,callback) {

	if(!engine) return

	// collect stream of words until there is a breath worth of material to send to tts
	let breath = ''
	const stream_callback = (event) => {
		if(event.fragment && event.fragment.length) {
			const match = event.fragment.match(/.*?[.,!?]/);
			if(match && breath.length > 20) {
				const i = match[0].length
				breath += event.fragment.slice(0,i)
				callback({breath})
				breath = event.fragment.slice(i)
			} else {
				breath += event.fragment
			}
		}
		if(event.message) {
			callback({breath})
			callback({message:event.message})
		}
	}

	const asyncChunkGenerator = await engine.chat.completions.create(request);
	for await (const chunk of asyncChunkGenerator) {
		if(!chunk.choices || !chunk.choices.length || !chunk.choices[0].delta) continue
		const fragment = chunk.choices[0].delta.content || ""
		stream_callback({request,fragment})
	}
	const message = await engine.getMessage()
	stream_callback({message})
}


