export const page = async (request, reply) => reply.view('index');

export const welcome = async (request, reply) => {
	const {user} = request;
	if (user) {
    return reply.view('partials/welcome/greet');
	}

  return reply.view('partials/welcome/unlogged');
};
