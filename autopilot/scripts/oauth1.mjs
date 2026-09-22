// 最小限のOAuth1.0a署名ヘルパー（外部依存なし・Node組み込みcryptoのみ）。
import { createHmac, randomBytes } from 'node:crypto';

function pct(s) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export function buildOAuthHeader({ method, url, params = {}, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const baseString =
    method.toUpperCase() +
    '&' +
    pct(url) +
    '&' +
    pct(
      Object.keys(allParams)
        .sort()
        .map((k) => `${pct(k)}=${pct(allParams[k])}`)
        .join('&')
    );

  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

  const headerParams = { ...oauthParams, oauth_signature: signature };
  const header =
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${pct(k)}="${pct(headerParams[k])}"`)
      .join(', ');
  return header;
}
