export const page = async (request, res) => res.view('index');

export const welcome = async (request, res) => {
	const {user} = request;
	if (user) {
		return res.view('partials/welcome/greet');
	}
	return res.view('partials/welcome/unlogged');
};
