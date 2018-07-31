import { RECORDING_STOPPED } from './constants';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	const { type } = message;
	switch (type) {
		case RECORDING_STOPPED:
			chrome.windows.update(sender.tab.windowId, { focused: true });
	}
});

chrome.browserAction.onClicked.addListener(() => {
	const width = 800;
	const height = 650;
	const top = (window.screen.availHeight - height) / 2;
	const left = (window.screen.availWidth - width) / 2;
	chrome.windows.create({
		url: chrome.extension.getURL('index.html'),
		width,
		height,
		top,
		left,
		type: 'popup',
	});
});

