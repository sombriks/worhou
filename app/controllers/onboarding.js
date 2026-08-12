
export const page = async (request, res) => res.view('index');

export const welcome = async (request, res) => {
  const {tokenPayload} = request;
  if (tokenPayload) {
    return res.view('partials/welcome/greet',{user:tokenPayload.sub});
  } else {
    return res.view('partials/welcome/unlogged');
  }
};
