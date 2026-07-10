document.addEventListener('DOMContentLoaded', () => {
	const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
	if ($navbarBurgers.length > 0) {
		for (const element of $navbarBurgers) {
			element.addEventListener('click', () => {
				const {target} = element.dataset;
				const $target = document.getElementById(target);
				element.classList.toggle('is-active');
				$target.classList.toggle('is-active');
			});
		}
	}
});
