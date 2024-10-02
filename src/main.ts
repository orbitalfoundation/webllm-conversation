
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

export function setSystemContent(content: string) {
	request.messages[0].content = content;
}

export function getInitialSystemContent() {
	return request.messages[0].content;
}

const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input') as HTMLInputElement;
const systemContentInput = document.getElementById('system-content-input') as HTMLTextAreaElement;

// Set initial content
systemContentInput.value = getInitialSystemContent();

// Focus the message input when the page loads
window.addEventListener('load', () => {
	messageInput.focus();
});

systemContentInput.addEventListener('input', () => {
	const systemContent = systemContentInput.value;
	setSystemContent(systemContent);
});

import { reason_load, reason } from './puppet/reason.js'

const statusBox = document.getElementById('status-box');
const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
const progressText = document.getElementById('progress-text');

function setStatus(status: 'ready' | 'thinking' | 'speaking') {
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

async function load() {
	reason_load((report: any) => {
		console.log(report)
		if (report.text) {
			const match = report.text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
			if (match) {
				const [current, total] = match.slice(1).map(Number);
				updateProgress(current, total);
			}
		}
		if(report.progress) {
			setStatus('ready')
			if (progressBar && progressText) {
				progressBar.style.display = 'none';
				progressText.style.display = 'none';
			}
		}
	})
}

// start async load
load()

//
// handle user input
//

chatForm?.addEventListener('submit', async (e) => {
	e.preventDefault();
	const message = messageInput.value.trim();
	if (!message || !message.length) {
		// do send a null message to force an abort of previous request 
		reason(request, null, (response) => {} )
		setStatus('ready');
		return
	};
	addMessage('You', message);
	setStatus('thinking');
	reason(request, message, (response) => {
		if (response.breath && response.breath.length) {
			setStatus('speaking');
			addMessage('LLM', response.breath);
		}
		if (response.message) {
			console.log("...done");
			setStatus('ready');
		}
	});
	messageInput.value = '';
});

function addMessage(sender: string, text: string) {
	const messageElement = document.createElement('div');
	messageElement.textContent = `${sender}: ${text}`;
	messagesContainer?.appendChild(messageElement);
	if (messagesContainer) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}
}
