export function processUsername(username: string) {
  if (username.startsWith("@")) {
    return username.substring(1);
  }
  return username;
}
