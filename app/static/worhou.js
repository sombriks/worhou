/**
 * Details about the person already known in this browser
 */
class WorHou {
	static #instance;
	#user;

	constructor(clear = false) {
		if (!clear && WorHou.#instance) {
			return WorHou.#instance;
		}

		localStorage.removeItem('user');
		WorHou.#instance = this;

		// Get the user from local storage
		this.#user = JSON.parse(localStorage.getItem('user'));
		if (!this.#user) {
			this.#user = {
				name: 'Stranger',
				visits: 0,
				logins: 0,
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

	get logins() {
		return this.#user?.logins || 0;
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
