import React from 'react';
import styles from '../App.css';
import { Desktop, Window, Tab, Camera } from '../assets/svg';
import { getChromeVersion } from '../utils';

const chromeVersion = getChromeVersion();

function VideoSource({ type, isRecording, onChange }) {
	return (
		<div className={styles.buttons}>
			<button onClick={() => onChange('screen')} className={type === 'screen' ? styles.active : ''} disabled={isRecording}><span><Desktop /></span> Desktop</button>
			<button onClick={() => onChange('window')} className={type === 'window' ? styles.active : ''} disabled={isRecording}><span><Window /></span> Window</button>
			<button onClick={() => onChange('tab')} className={type === 'tab' ? styles.active : ''} hidden={chromeVersion < 53} disabled={isRecording}><span><Tab /></span>Chrome Tab</button>
			<button onClick={() => onChange('camera')} className={type === 'camera' ? styles.active : ''} disabled={isRecording}><span><Camera /></span>Camera</button>
		</div>
	);
}

export default VideoSource;
