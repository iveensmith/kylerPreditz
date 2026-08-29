/**
 * Public contact channels. Single source of truth - the footer and the
 * about / VIP / legal pages all read from here, so a changed handle or number
 * only needs editing in one place.
 */
export const CONTACT = {
  whatsapp: {
    /** Display form, with the leading +. */
    number: "+2349044560336",
    /** wa.me expects the number with no +, spaces, or dashes. */
    href: "https://wa.me/2349044560336",
  },
  telegramChat: {
    handle: "@CEO_kylerpredict",
    href: "https://t.me/CEO_kylerpredict",
  },
  telegramChannel: {
    href: "https://t.me/+EErgpui1zBowYzE8",
  },
  email: {
    address: "uniquepredict539@gmail.com",
    href: "mailto:uniquepredict539@gmail.com",
  },
} as const;
