
import { llm_load, llm_invoke, llm_stop } from './llm.js'

export async function reason_load(callback) {
	await llm_load(callback)
}

export async function reason(request,content,breath_callback) {

	// always stop the llm if there is new possible content
	await llm_stop()

	// simply do nothing if no content; although it will stop previous content
	if (!content || !content.length) {
		return
	}

	// append supplied prompt onto llm reasoning chain
	request.messages.push( { role: "user", content } )

	// collect stream of words until there is a breath worth of material to send to tts
	request.breath = ''
	const stream_callback = (event) => {
		if(event.fragment && event.fragment.length) {
			const match = event.fragment.match(/.*?[.,!?]/);
			if(match && request.breath.length > 20) {
				const i = match[0].length
				request.breath += event.fragment.slice(0,i)
				breath_callback({breath:request.breath})
				request.breath = event.fragment.slice(i)
			} else {
				request.breath += event.fragment
			}
		}
		if(event.message) {
			breath_callback({breath:request.breath})
			breath_callback({message:event.message})
		}
	}

	// start llm
	await llm_invoke(request,stream_callback)

}


