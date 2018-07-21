import React from 'react';
import ReactDOM from 'react-dom';
import './assets/globals.css';
import styles from './App.css';
import { Logo, Desktop, Window, Tab, Camera } from './assets/svg';
import AppearAfter from './AppearAfter';
import Source from './Source';

const videoSources = [
	{
		type: 'screen',
		icon: Desktop,
		label: 'Screen',
	},
	{
		type: 'window',
		icon: Window,
		label: 'Window',
	},
	{
		type: 'tab',
		icon: Tab,
		label: 'Chrome Tab',
	},
	{
		type: 'camera',
		icon: Camera,
		label: 'Camera',
	},
];

const audioSources = [
	{
		type: 'none',
		icon: Desktop,
		label: 'None',
	},
	{
		type: 'mic',
		icon: Window,
		label: 'Microphone',
	},
	{
		type: 'system',
		icon: Tab,
		label: 'System',
	},
];

function getUserMediaError() {
	chrome.runtime.openOptionsPage();
	console.log('getUserMedia() failed');
}

function analytics(data) {
	/* eslint-disable no-underscore-dangle */
	if (window._gaq) {
		window._gaq.push(data);
	}
	/* eslint-enable no-underscore-dangle */
}

function downloadByteArray(data, name) {
	const blob = new Blob(data, { type: 'video/webm' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	document.body.appendChild(a);
	a.style = 'display: none';
	a.target = '_blank';
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 100);
}

class App extends React.Component {
	state = {
		isRecording: false,
		includeAudioMic: false,
		includeAudioSystem: false,
		hasSource: false,
		videoSource: undefined,
		audioSource: 'none',
	};

	audioStream;
	recorder;
	localStream;
	recordedChunks = [];

	setVideoSource = (type) => {
		this.setState({ videoSource: type });
	}

	setAudioSource = (type) => {
		analytics(['_trackEvent', 'video', 'setAudio', type]);
		switch (type) {
			case 'mic':
				this.setState({
					includeAudioMic: true,
					includeAudioSystem: false,
					audioSource: type,
				});
				navigator.getUserMedia({
					audio: true,
					video: false,
				}, this.gotAudio, getUserMediaError);
				break;
			case 'system':
				this.setState({
					includeAudioMic: false,
					includeAudioSystem: true,
					audioSource: type,
				});
				break;
			default:
				this.setState({
					includeAudioMic: false,
					includeAudioSystem: false,
					audioSource: type,
				});
		}
	}

	record = () => {
		console.log('Start recording');
		analytics(['_trackEvent', 'video', 'recordingStarted', this.state.videoSource]);
		if (this.video) {
			this.video.muted = true; // prevent audio loopback
		}
		this.setState({ hasStarted: true });
		if (window.outerHeight < 600) {
			const delta = 600 - window.outerHeight;
			window.resizeTo(window.outerWidth, 600);
			window.moveTo(window.screenLeft, window.screenTop - (delta / 2));
		}
		this.recordedChunks = [];
		const sourceType = [this.state.videoSource];
		switch (this.state.videoSource) {
			case 'window':
			case 'screen':
			case 'tab':
				if (this.state.includeAudioSystem) {
					sourceType.push('audio');
				}
				if (this.state.includeAudioMic) {
					navigator.getUserMedia({
						audio: true,
						video: false,
					}, this.gotAudio, getUserMediaError);
				}
				chrome.desktopCapture.chooseDesktopMedia(sourceType, this.onAccessApproved);
				break;
			case 'camera':
				navigator.getUserMedia({
					audio: false,
					video: {
						mandatory: {
							minWidth: 1280,
							minHeight: 720,
						},
					},
				}, this.gotMediaStream, getUserMediaError);
				break;
		}
	}

	onAccessApproved = (id) => {
		if (!id) {
			console.log('Access to media rejected');
			return;
		}

		navigator.getUserMedia({
			audio: {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: id,
				},
			},
			video: {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: id,
					maxWidth: window.screen.width,
					maxHeight: window.screen.height,
				},
			},
		}, this.gotMediaStream, getUserMediaError);
	}

	gotMediaStream = (stream) => {
		console.log('Received local stream');
		const src = URL.createObjectURL(stream);
		this.setState({ hasSource: true, src });
		this.localStream = stream;
		stream.getTracks().forEach((track) => {
			track.addEventListener('ended', () => {
				console.log(stream.id, 'track ended', track.kind, track.id);
				this.stopRecording();
			});
		});

		if (this.state.includeAudioMic) {
			console.log('Adding mic audio track');
			const audioTracks = this.audioStream.getAudioTracks();
			this.localStream.addTrack(audioTracks[0]);
		}
		/* if (this.state.includeAudioSystem) {
			console.log('Checking for system audio track');
			const audioTracks = stream.getAudioTracks();
			if (audioTracks.length < 1) {
				console.log('No audio track in screen stream');
			}
		} */

		try {
			this.recorder = new MediaRecorder(stream);
		} catch (err) {
			console.error('Error creating MediaRecorder', err);
			return;
		}
		this.recorder.ondataavailable = this.recorderOnDataAvailable;
		this.recorder.onstop = this.recorderOnStop;
		this.recorder.start();
		this.setState({ isRecording: true });
	};

	gotAudio = (stream) => {
		console.log('Received audio stream');
		this.audioStream = stream;
		stream.getTracks().forEach((track) => {
			track.addEventListener('ended', () => {
				console.log(stream.id, 'track ended', track.kind, track.id);
			});
		});
	};

	recorderOnDataAvailable = (event) => {
		if (event.data && event.data.size > 0) {
			this.recordedChunks.push(event.data);
		}
	}

	recorderOnStop = () => {
		const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
		const src = URL.createObjectURL(blob);
		this.setState({ isRecording: false, hasSource: true, src });
	}

	stopRecording = () => {
		console.log('Stop recording');
		this.recorder.stop();
		this.localStream.getVideoTracks()[0].stop();
		this.setState({ isRecording: false });
		analytics(['_trackEvent', 'video', 'recordingStopped']);
	}

	save = () => {
		downloadByteArray(this.recordedChunks, 'screen-capture.webm');
		analytics(['_trackEvent', 'video', 'saved']);
	}

	render() {
		const { isRecording, videoSource, audioSource, hasSource, src, hasStarted } = this.state;
		return (
			<div className={`${styles.app} ${hasStarted || isRecording ? styles.recording : ''}`}>
				<AppearAfter className={styles.logo}>
					<div>
						<Logo />
						<h1>Screen Recoder</h1>
					</div>
				</AppearAfter>
				{!hasSource && <div>
					<AppearAfter className={styles.controls} delay={300}>
						<div>
							<span className={styles.title}><h2>What do you want to capture?</h2></span>
							<Source
								value={videoSource}
								isRecording={isRecording}
								onChange={this.setVideoSource}
								sources={videoSources}
							/>
						</div>
					</AppearAfter>
					{videoSource && <AppearAfter className={styles.controls} delay={400}>
						<div>
							<span className={styles.title}><h2>Record audio?</h2></span>
							<Source
								value={audioSource}
								isRecording={isRecording}
								onChange={this.setAudioSource}
								sources={audioSources}
							/>
						</div>
					</AppearAfter>}
					<AppearAfter className={styles.controls} delay={500}>
						<div>
							<button onClick={this.record} hidden={isRecording || !videoSource}>Start recording</button>
							<button onClick={this.stopRecording} hidden={!isRecording}>Stop Recording</button>
						</div>
					</AppearAfter>
				</div>}
				{hasSource && <div>
					<div>
						<button onClick={this.stopRecording} hidden={!isRecording}>Stop Recording</button>
						<video
							autoPlay={isRecording}
							muted
							ref={(ref) => { this.video = ref; }}
							src={src}
							controls={!isRecording}
						/>
					</div>
					<div className={styles.controls}>
						<button onClick={this.save} disabled={isRecording}>Save</button>
					</div>
				</div>}
			</div>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('app'));

setTimeout(() => {
	analytics(['_setAccount', 'UA-114990894-1']);
	analytics(['_trackPageview']);
}, 1000);
