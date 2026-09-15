/* global htmx */

/**
 Details about the person already known in this browser/device
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
        token: null,
        visits: 0,
        device: uuidGen(),
      };
      localStorage.setItem('user', JSON.stringify(this.#user));
    }

    if (!this.#user?.device) {
      this.#user.device = crypto.randomUUID();
      localStorage.setItem('user', JSON.stringify(this.#user));
    }
  }

  get userName() {
    return this.#user?.name || 'Stranger';
  }

  get device() {
    return this.#user.device;
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

  get bearer() {
    if (this.#user?.token) {
      return `Bearer ${this.#user.token}`;
    }

    return null;
  }

  set token(token) {
    this.#user.token = token;
    const payload = token?.split('.', 2)[1];
    const detail = JSON.parse(atob(payload));
    this.#user.name = detail?.sub?.name;
    localStorage.setItem('user', JSON.stringify(this.#user));
  }

  logout() {
    this.#user.token = null;
    this.#user.name = 'Stranger';
    localStorage.setItem('user', JSON.stringify(this.#user));
    globalThis.location.reload();
  }

  async download(url, params) {
    const queryString = new URLSearchParams(params).toString();
    const downloadUrl = queryString ? `${url}?${queryString}` : url;

    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: this.bearer,
        }
      });
      if (!response.ok) {
        return alert('CSV failed');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;

      const disposition = response.headers.get('Content-Disposition');
      if (disposition?.includes('filename=')) {
        a.download = disposition.split('filename=')[1].replace(/['"]/g, '');
      } else {
        a.download = '';
      }

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      alert('CSV failed');
    }
  }
}

// Request setup
htmx.registerExtension('hx-Authorization', {
  htmx_before_request(elt, detail) {
    const w = new WorHou();
    if (w.bearer) {
      detail.ctx.request.headers.Authorization = w.bearer;
    }
  },
});

// polyfill
function uuidGen() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
