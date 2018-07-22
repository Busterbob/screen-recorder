import React, { Fragment } from 'react';
import AppearAfter from './AppearAfter';
import styles from './Intro.css';
import { Logo } from './assets/svg';

function Intro() {
	return (
		<Fragment>
			<AppearAfter className={styles.logo}>
				<div>
					<Logo />
					<h1>Screen Recoder</h1>
				</div>
			</AppearAfter>
		</Fragment>
	);
}

export default Intro;
