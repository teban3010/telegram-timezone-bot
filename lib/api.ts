const readUrl = (url = '') =>
  url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${process.env.NEXT_PUBLIC_API}${url}`;

const requestHeaders = (headers = {}) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...headers,
});

export class FetchError extends Error {
  response: Response;
  status: number;

  constructor(message: string, response: Response, status: number) {
    super(message);

    this.response = response;
    this.status = status;
  }
}

const responseHandler = async (response: Response) => {
  if (!response.ok) {
    // create error object and reject if not a 2xx response code
    const errorMessage = response?.body
      ? (await response.json()).error
      : 'HTTP status code: ' + response.status;

    throw new FetchError(errorMessage, response, response.status);
  }

  if (response.status === 204) {
    return;
  }

  return response.json();
};

const get = (url = '', headers = {}) =>
  fetch(readUrl(url), {
    method: 'GET',
    headers: requestHeaders(headers),
  }).then(responseHandler);

const post = (url = '', body = {}, headers = {}) =>
  fetch(readUrl(url), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: requestHeaders(headers),
  }).then(responseHandler);

const put = (url = '', body = {}, headers = {}) =>
  fetch(readUrl(url), {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: requestHeaders(headers),
  }).then(responseHandler);

const del = (url = '', headers = {}) =>
  fetch(readUrl(url), {
    method: 'DELETE',
    headers: requestHeaders(headers),
  }).then(responseHandler);

export const API = {
  get,
  post,
  put,
  delete: del,
};
