
import { llm_load, llm_invoke, llm_stop } from './llm.js'

export async function reason_stop() {
	await llm_stop()
}

export async function reason_load(callback) {
	await llm_load(callback)
}

export async function reason(request,callback) {

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

	// start llm
	await llm_invoke(request,stream_callback)

}


