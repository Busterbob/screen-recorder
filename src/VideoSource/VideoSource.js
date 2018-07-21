import React from 'react';
import styles from '../App.css';
import { Desktop, Window, Tab, Camera } from '../assets/svg';
import { getChromeVersion } from '../utils';

const chromeVersion = getChromeVersion();

function Button({
	onClick,
	className,
	disabled,
	label,
	icon,
}) {
	const Icon = icon;
	return (
		<button onClick={onClick} className={className} disabled={disabled}>
			<span><Icon /></span>
			<span><Icon /></span>
			{label}
		</button>
	);
}

function VideoSource({ type, isRecording, onChange }) {
	return (
		<div className={styles.buttons}>
			<Button
				onClick={() => onChange('screen')}
				className={type === 'screen' ? styles.active : ''}
				disabled={isRecording}
				icon={Desktop}
				label="Screen"
			/>
			<Button
				onClick={() => onChange('window')}
				className={type === 'window' ? styles.active : ''}
				disabled={isRecording}
				icon={Window}
				label="Window"
			/>
			<Button
				onClick={() => onChange('tab')}
				className={type === 'tab' ? styles.active : ''}
				hidden={chromeVersion < 53}
				disabled={isRecording}
				icon={Tab}
				label="Chrome Tab"
			/>
			<Button
				onClick={() => onChange('camera')}
				className={type === 'camera' ? styles.active : ''}
				disabled={isRecording}
				icon={Camera}
				label="Camera"
			/>
		</div>
	);
}

export default VideoSource;
