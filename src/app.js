import React from 'react';
import ReactDOM from 'react-dom';
import './assets/globals.css';
import styles from './App.css';
import { Logo, Desktop, Window, Tab, Camera } from './assets/svg';
import AppearAfter from './AppearAfter';


function getChromeVersion() {
	const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
	return raw ? parseInt(raw[2], 10) : false;
}

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
		type: undefined,
	};

	audioStream;
	recorder;
	localStream;
	recordedChunks = [];

	setAudio = (event) => {
		analytics(['_trackEvent', 'video', 'setAudio', event.target.value]);
		switch (event.target.value) {
			case 'mic':
				this.setState({
					includeAudioMic: true,
					includeAudioSystem: false,
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
				});
				break;
			default:
				this.setState({
					includeAudioMic: false,
					includeAudioSystem: false,
				});
		}
	}

	record = () => {
		console.log('Start recording');
		analytics(['_trackEvent', 'video', 'recordingStarted', this.state.type]);
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
		const sourceType = [this.state.type];
		switch (this.state.type) {
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
		const chromeVersion = getChromeVersion();
		const { isRecording, type, hasSource, src, hasStarted } = this.state;
		return (
			<div className={`${styles.app} ${hasStarted || isRecording ? styles.recording : ''}`}>
				<AppearAfter className={styles.logo}>
					<div>
						<Logo />
						<h1>Screen Recoder</h1>
					</div>
				</AppearAfter>
				<div className={styles.controls}>
					<span className={styles.title}><h2>What do you want to capture?</h2></span>
					<div className={styles.buttons}>
						<button onClick={() => this.setState({ type: 'screen' })} className={type === 'screen' ? styles.active : ''} disabled={isRecording}><span><Desktop /></span> Desktop</button>
						<button onClick={() => this.setState({ type: 'window' })} className={type === 'window' ? styles.active : ''} disabled={isRecording}><span><Window /></span> Window</button>
						<button onClick={() => this.setState({ type: 'tab' })} className={type === 'tab' ? styles.active : ''} hidden={chromeVersion < 53} disabled={isRecording}><span><Tab /></span>Chrome Tab</button>
						<button onClick={() => this.setState({ type: 'camera' })} className={type === 'camera' ? styles.active : ''} disabled={isRecording}><span><Camera /></span>Camera</button>
					</div>
				</div>
				<div className={styles.controls}>
					Record audio?<br />
					<label><input type="radio" name="audio" onChange={this.setAudio} value="none" disabled={isRecording} defaultChecked />None</label>
					<label><input type="radio" name="audio" onChange={this.setAudio} value="mic" disabled={isRecording} />Microphone</label>
					<label><input type="radio" name="audio" onChange={this.setAudio} value="system" hidden={chromeVersion < 51} disabled={isRecording} />System</label>
				</div>
				<div className={styles.controls}>
					<button onClick={this.record} hidden={isRecording || !type}>Start recording</button>
					<button onClick={this.stopRecording} hidden={!isRecording}>Stop Recording</button>
				</div>
				{hasSource && <div>
					<div>
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
