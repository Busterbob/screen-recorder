import React from 'react';
import ReactDOM from 'react-dom';
import AppearAfter from './AppearAfter';
import './assets/globals.css';
import styles from './Options.css';

class Options extends React.Component {
	state = { permissionRequested: false }
	componentDidMount() {
		this.setState({ permissionRequested: true });
		navigator.getUserMedia({ audio: true, video: true }, () => {
			this.setState({ permissionRequested: false, permissionGranted: true });
		}, () => {
			this.setState({ permissionRequested: false, permissionGranted: false });
		});
	}

	render() {
		const { permissionRequested, permissionGranted } = this.state;
		return <div className={styles.options}>
			<AppearAfter className={styles.message}>
				<div>
					<span className={styles.title}><h2>Permissions</h2></span>
					{permissionRequested && <div className={styles.info}>Please grant permission</div>}
					{permissionGranted === true && <div className={styles.success}>Permission granted</div>}
					{permissionGranted === false && <div className={styles.error}>Permission denied</div>}
				</div>
			</AppearAfter>
			<AppearAfter className={styles.message} delay={300}>
				<div>
					<span className={styles.title}><h2>About</h2></span>
					<p>
						Screen Recorder is a Chrome extension to record a video from the
						camera or capture it from the screen
						(desktop, specific application window or Chrome tab).
					</p>
					<p>
						Designed and Developed by:
					</p>
					<ul className={styles.team}>
						<li>
							<a href="https://eb1.it/" target="_blank">
								<img src="https://i.imgur.com/QTAIxX7.jpg" alt="Erich Behrens"/>
								<i>Erich Behrens</i>
							</a>
							<span>Developer</span>
						</li>
						<li>
							<a href="https://www.riangle.com/" target="_blank">
								<img src="https://i.imgur.com/TMJhnNc.jpg" alt="Luan Gjokaj"/>
								<i>Luan Gjokaj</i>
							</a>
							<span>Designer</span>
						</li>
					</ul>
				</div>
			</AppearAfter>
		</div>;
	}
}

ReactDOM.render(<Options />, document.getElementById('app'));

setTimeout(() => {
	/* eslint-disable no-underscore-dangle */
	if (window._gaq) {
		window._gaq.push(['_setAccount', 'UA-114990894-1']);
		window._gaq.push(['_trackPageview']);
	}
}, 1000);
