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
					<span className={styles.title}><h2>Perimissions</h2></span>
					{permissionRequested && <div className={styles.info}>Please grant permission</div>}
					{permissionGranted === true && <div className={styles.success}>Permission granted</div>}
					{permissionGranted === false && <div className={styles.error}>Permission denied</div>}
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
