export function getQueryParameter(name) {
  const queryMatch = location.search.match(new RegExp(`${name}=([^\\&]+)`));
  if (!queryMatch) {
    return "";
  }
  const [,value] = queryMatch;
  if (!value) {
    return "";
  }
  return value;
}

export function decodeCode(code) {
  return decodeURI(atob(code));
}

export function encodeCode(code) {
  return encodeURI(
    btoa(code)
  );
}
