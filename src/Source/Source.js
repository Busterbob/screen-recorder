import React from 'react';
import styles from '../App.css';

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
			<span><Icon /><Icon /></span>
			{label}
		</button>
	);
}

function Source({ type, isRecording, onChange, sources }) {
	return (
		<div className={styles.buttons}>
			{sources.map(source => (
				<Button
					onClick={() => onChange(source.type)}
					className={type === source.type ? styles.active : ''}
					disabled={isRecording}
					icon={source.icon}
					label={source.label}
				/>
			))}
		</div>
	);
}

export default Source;
