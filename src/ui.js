// DOM helpers. Elements are built with textContent, never innerHTML, so API data can't inject markup.
export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.flat().filter((c) => c != null));
  return node;
}

export const clear = (node) => node.replaceChildren();

const statusEl = () => document.querySelector('#status');

export function showLoading(message = 'Loading…') {
  statusEl().className = 'is-loading';
  statusEl().replaceChildren(h('span', { class: 'spinner', 'aria-hidden': 'true' }), message);
}

export function showMessage(message) {
  statusEl().className = '';
  statusEl().textContent = message;
}

export function showError(message, onRetry) {
  statusEl().className = 'is-error';
  statusEl().replaceChildren(
    `${message} `,
    h('button', { type: 'button', onclick: onRetry }, 'Try again')
  );
}

export function clearStatus() {
  statusEl().className = '';
  statusEl().textContent = '';
}
