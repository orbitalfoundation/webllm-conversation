

let request = {
	stream: true,
	messages: [
		{
			role: "system",
			content: "You are a whimsical forest creature concerned not with mortal desires. "
		}
	],
	temperature: 0.3,
	max_tokens: 256,
	breath: ''
}

///////////////////////////////////////////////////////////////////////////////////////
//
// bind to display / html stuff
//
///////////////////////////////////////////////////////////////////////////////////////

const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input') as HTMLInputElement;
const systemContentInput = document.getElementById('system-content-input') as HTMLTextAreaElement;
const statusBox = document.getElementById('status-box');
const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
const progressText = document.getElementById('progress-text');
const voiceButton = document.getElementById('voice-button') as HTMLButtonElement;

// As a convenience for users please focus the message input when the page loads
window.addEventListener('load', () => {
	messageInput.focus();
});

// A user can change the prompt overall, if so then write it back into the prompt
systemContentInput.addEventListener('input', () => {
	request.messages[0].content = systemContentInput.value;
});

// For starting conditions write the system content from above into the displayed prompt box
systemContentInput.value = request.messages[0].content;

// If the user types in something, then lets pass it to the reasoning engine
chatForm?.addEventListener('submit', async (e) => {

	// stop the browser from changing the screen
	e.preventDefault();

	// call our logic that deals with user prompts
	dealWithUserPrompt(messageInput.value.trim());

	// please clear up the input box - as a visual indicator that the user input was consumed
	messageInput.value = '';
});

function addMessageToDisplay(sender: string, text: string) {
	const messageElement = document.createElement('div');
	messageElement.textContent = `${sender}: ${text}`;
	messagesContainer?.appendChild(messageElement);
	if (messagesContainer) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}
}

function setStatusOnDisplay(status: 'ready' | 'thinking' | 'speaking') {
	if (statusBox) {
		statusBox.className = `status-${status}`;
		statusBox.textContent = status.charAt(0).toUpperCase() + status.slice(1);
	}
}

function updateProgress(current: number, total: number) {
	if (progressBar && progressText) {
		const percentage = (current / total) * 100;
		progressBar.value = percentage;
		progressText.textContent = `${current}/${total} (${percentage.toFixed(1)}%)`;
	}
}



///////////////////////////////////////////////////////////////////////////////////////
//
// talk to reasoning support
//
///////////////////////////////////////////////////////////////////////////////////////

import { reason_load, reason, reason_stop } from './puppet/reason.js'

async function load() {
	reason_load((report: any) => {
		if (report.text) {
			const match = report.text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
			if (match) {
				const [current, total] = match.slice(1).map(Number);
				updateProgress(current, total);
			}
		}
		if(report.progress) {
			setStatusOnDisplay('ready')
			setVoicePermitted(true)
			if (progressBar && progressText) {
				progressBar.style.display = 'none';
				progressText.style.display = 'none';
			}
		}
	})
}

// start async load of the model with visual feedback
load()

// deal with user inputs
async function dealWithUserPrompt(message) {

	// always stop the llm if there is new possible content
	await reason_stop()

	// if the user didn't type anything then let's just do nothing
	if (!message || !message.length) {
		setStatusOnDisplay('ready');
		setVoicePermitted(true)
		return
	};

	// go ahead and paint the users input into the main display area
	addMessageToDisplay('You', message);

	// paint a pretty picture that the bot is thinking
	setStatusOnDisplay('thinking');

	// stuff the message into the total reasoning blob that will be passed to the llm
	request.messages.push( { role: "user", content:message } )

	// go ahead and do the actual reasoning inside of the llm worker
	reason(request, (response) => {
		if (response.breath && response.breath.length) {
			setStatusOnDisplay('speaking');
			setVoicePermitted(false)
			addMessageToDisplay('LLM', response.breath);
		}
		if (response.message) {
			console.log("...done");
			setStatusOnDisplay('ready');
			setVoicePermitted(true)
		}
	});
}





///////////////////////////////////////////////////////////////////////////////////////
//
// voice support
//
///////////////////////////////////////////////////////////////////////////////////////


let voice = null

function voiceSetup() {

    if ('webkitSpeechRecognition' in window) {
        const webkitSpeechRecognition = window['webkitSpeechRecognition'] as any;
        voice = new webkitSpeechRecognition() as any;
        voice.continuous = true;
        voice.interimResults = true;
        voice.onresult = (event:any) => {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript as string
                if (event.results[i].isFinal && text && text.length) {
                	dealWithUserPrompt(text)
                }
            }
        }
    } else {
        console.error('webkitSpeechRecognition is not supported in this browser.');
    }
}

let voicePermitted = false
let voiceDesiredState = false
let voiceState = false

function updateVoiceState() {

	if(!voice) return

	if(!voicePermitted) {
		voiceButton.innerHTML = "Voice is disabled"
	} else if(voiceDesiredState) {
		voiceButton.innerHTML = "Click to disable Voice Input"
	} else {
		voiceButton.innerHTML = "Click to enable Voice Input"
	}

	if(!voiceState && voiceDesiredState && voicePermitted) {
		voiceState = true
		voice.start()
	}

	else if(voiceState && (!voiceDesiredState || !voicePermitted)) {
		voiceState = false
		voice.stop()
	}
}

function setVoicePermitted(state=true) {
	voicePermitted = state
	updateVoiceState()
}

function setVoiceDesired() {
	// browser forces user interaction to start the voice service
	if(!voice) {
		voiceSetup()
	}
	// set desired state
	voiceDesiredState = voiceDesiredState ? false : true
	updateVoiceState()
}

voiceButton.onclick = setVoiceDesired


