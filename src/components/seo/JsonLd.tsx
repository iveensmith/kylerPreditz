/** Renders a JSON-LD structured data block. `data` must be trusted/server-generated - never pass raw user input. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
