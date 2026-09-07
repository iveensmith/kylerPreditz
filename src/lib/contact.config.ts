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
    handle: "@CEO_Uniquepredict",
    href: "https://t.me/CEO_Uniquepredict",
  },
  telegramChannel: {
    href: "https://t.me/+EErgpui1zBowYzE8",
  },
  x: {
    handle: "@Kyler_TL29",
    href: "https://x.com/Kyler_TL29",
  },
  email: {
    address: "uniquepredict539@gmail.com",
    href: "mailto:uniquepredict539@gmail.com",
  },
} as const;
