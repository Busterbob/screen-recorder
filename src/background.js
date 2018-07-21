chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	chrome.desktopCapture.chooseDesktopMedia(
		['screen', 'window'],
		(id) => {
			sendResponse({ id });
		},
	);
});

chrome.browserAction.onClicked.addListener(() => {
	const width = 800;
	const height = 500;
	const top = (window.screen.availHeight - height) / 2;
	const left = (window.screen.availWidth - width) / 2;
	window.open(chrome.extension.getURL('index.html'), 'screen-recorder', `width=${width},height=${height},top=${top},left=${left}`);
});

