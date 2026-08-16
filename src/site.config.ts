/**
 * Static secret number that unlocks Finora.
 *
 * This value lives in the GitHub repo itself, so the SAME number opens the
 * app from any device. Change it to any 4–6 digit number and push to GitHub
 * to update it everywhere.
 *
 * IMPORTANT: this is a low-security personal gate by design. The number is
 * part of the published app, so anyone who inspects the source could find it.
 * Do not use it to protect anything that needs real security.
 */
export const SITE_SECRET = '3566'
