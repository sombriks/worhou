/**
 * Details about the person already known in this browser
 */
class WorHou {
	static #instance;
	#user;

	constructor(clear = false) {
		if (clear) {
			localStorage.removeItem('user');
			WorHou.#instance = null;
		}

		if (WorHou.#instance) {
			return WorHou.#instance;
		}

		WorHou.#instance = this;

		// Get the user from local storage
		this.#user = JSON.parse(localStorage.getItem('user'));
		if (!this.#user) {
			this.#user = {
				name: 'Stranger',
				visits: 0,
			};
			localStorage.setItem('user', JSON.stringify(this.#user));
		}
	}

	get userName() {
		return this.#user?.name || 'Stranger';
	}

	get visits() {
		return this.#user?.visits || 0;
	}

	incrementVisits() {
		this.#user.visits++;
		localStorage.setItem('user', JSON.stringify(this.#user));
	}

	get logged() {
		return this.#user?.token !== null
			&& this.#user?.token !== undefined;
	}

	set token(token) {
		this.#user.token = token;
		const payload = token?.split('\.')[1];
		const detail = JSON.parse(atob(payload));
		this.#user.name = detail?.sub?.name;
		localStorage.setItem('user', JSON.stringify(this.#user));
	}

	logout() {
		this.#user.token = undefined;
		this.#user.name = 'Stranger';
		localStorage.setItem('user', JSON.stringify(this.#user));
	}
}

/**
 * Simple LOB hook
 * @param hobHook function to receive the current parent element containing the
 * script tag
 */
const lobRoot = hobHook => {
	(() => {
		const element = document.currentScript.parentElement;
		hobHook(element);
	})();
};

// Final setup

globalThis.addEventListener('domcontentloaded', () => {
	// Htmx.config.logAll = true;
	document.body.addEventListener('htmx:configRequest', evt => {
		const user = localStorage.getItem('user');
		if (user && user.token) {
			evt.detail.headers.Authorization = `Bearer ${user.token}`;
		}
	});
});

