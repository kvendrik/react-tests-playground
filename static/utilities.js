function getQueryParameter(name) {
  const queryMatch = location.search.match(new RegExp(`${name}=([^\\&]+)`));
  if (!queryMatch) {
    return "";
  }
  const [, encodedValue] = queryMatch;
  if (!encodedValue) {
    return "";
  }
  return decodeURI(atob(encodedValue));
}
