// innerHTML を一切使わずに DOM を組み立てるための小さなヘルパー。
// (CSP/CI で innerHTML 代入を禁止しているため、これが唯一のDOM構築手段)

const EVENT_PREFIX = "on";

/**
 * @param {string} tag
 * @param {object} [attrs] - className / style(object) / value / checked / disabled / dataset(object) /
 *   onClick 等の on*(関数) / それ以外は setAttribute される
 * @param {Array<Node|string>} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith(EVENT_PREFIX) && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "className") {
      node.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(node.style, value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.assign(node.dataset, value);
    } else if (key === "value") {
      node.value = value;
    } else if (key === "checked") {
      node.checked = Boolean(value);
    } else if (key === "disabled") {
      node.disabled = Boolean(value);
    } else if (key === "html") {
      // 意図的に未対応。innerHTML は使わない。
      throw new Error("html attr is not supported (innerHTML is banned)");
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of [].concat(children)) {
    if (child === undefined || child === null || child === false) continue;
    node.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
  return node;
}

/** 指定要素の子を全て取り除く(innerHTMLへの代入は使わない) */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** node に children を差し替えて描画する */
export function render(node, children) {
  clear(node);
  for (const child of [].concat(children)) {
    if (child === undefined || child === null || child === false) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
}

// SVG名前空間URI。ネットワークアクセスは発生しない(createElementNSのローカル識別子)。
// ci.yml の外部URL検出は w3.org/2000/svg を許可リストとして除外しているため、素直に書く。
const SVG_NS = "http://www.w3.org/2000/svg";

/** SVG要素を作る(el()はHTML名前空間固定のためSVGには使えない) */
export function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child === undefined || child === null || child === false) continue;
    node.appendChild(child);
  }
  return node;
}
