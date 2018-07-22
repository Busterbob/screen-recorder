import React, { Fragment } from 'react';
import styles from '../App.css';
import AppearAfter from '../AppearAfter';

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

function Source({ value, isRecording, onChange, sources }) {
	return (
		<Fragment>
			<AppearAfter className={styles.buttons}>
				<div>
					{sources.map(source => (
						<Button
							onClick={() => onChange(source.type)}
							className={value === source.type ? styles.active : ''}
							disabled={isRecording}
							icon={source.icon}
							label={source.label}
						/>
					))}
				</div>
			</AppearAfter>
		</Fragment>
	);
}

export default Source;
