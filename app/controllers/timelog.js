export const page = async (request, res) => res.view('pages/timelog');

export const today = async (request, res) => {
	const {tokenPayload} = request;
	if (!tokenPayload) {
		return res.view('partials/please-login');
	}

	return res.view('partials/timelog/today');
};
