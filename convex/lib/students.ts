/**
 * The text the admin student search matches against: the name and the email, plus the email split
 * at "@" and "." so searching "gmail" or a username finds it too.
 */
export function studentSearchText(name: string, email: string | undefined) {
  return [name, email, email?.replace(/[@.+_-]+/g, " ")].filter(Boolean).join(" ");
}
