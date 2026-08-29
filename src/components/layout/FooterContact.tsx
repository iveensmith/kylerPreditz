import { CONTACT } from "@/lib/contact.config";

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366] shrink-0" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.87 9.87 0 004.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.06c-.24.68-1.42 1.32-1.95 1.37-.5.05-.97.24-3.27-.68-2.76-1.09-4.5-3.9-4.64-4.08-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.98.94-2.25.24-.27.53-.34.7-.34l.5.01c.16 0 .38-.06.59.45.24.58.82 2 .89 2.14.07.14.12.3.02.48-.09.18-.14.3-.28.46l-.42.49c-.14.14-.28.29-.12.57.16.27.72 1.18 1.54 1.91 1.06.94 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.16-.18.69-.8.87-1.08.18-.27.36-.23.61-.14.25.09 1.6.76 1.87.9.28.14.46.2.53.32.07.11.07.66-.17 1.35z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#229ED9] shrink-0" aria-hidden>
      <path d="M21.94 4.6l-3.02 14.26c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73L18.7 6.3c.37-.33-.08-.51-.58-.18L6.66 13.4l-4.66-1.46c-1.01-.32-1.03-1.01.21-1.5l18.22-7.02c.84-.31 1.58.2 1.31 1.47z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

const linkClass = "text-secondary hover:text-white underline underline-offset-2 transition-colors";

/** "Reach Us" footer column - contact channels, read from contact.config.ts. */
export function FooterContact() {
  return (
    <div>
      <h3 className="text-white font-semibold mb-3 border-l-2 border-secondary pl-2">Reach Us</h3>
      <ul className="flex flex-col gap-3">
        <li className="flex items-start gap-2">
          <WhatsAppIcon />
          <span>
            WhatsApp Only:{" "}
            <a href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-secondary transition-colors">
              {CONTACT.whatsapp.number}
            </a>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <TelegramIcon />
          <span>
            Telegram Only:{" "}
            <a href={CONTACT.telegramChat.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              click here to chat
            </a>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <TelegramIcon />
          <span>
            Telegram Channel:{" "}
            <a href={CONTACT.telegramChannel.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              click here
            </a>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <MailIcon />
          <span>
            Email Us:{" "}
            <a href={CONTACT.email.href} className="text-white hover:text-secondary transition-colors break-all">
              {CONTACT.email.address}
            </a>
          </span>
        </li>
      </ul>
    </div>
  );
}
