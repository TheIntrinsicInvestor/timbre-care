/**
 * The label / value / gloss / source quad, one per problem band, so all three
 * read identically.
 *
 * The source is a <div>, never a <figcaption>. tests/copy-audit.mjs samples
 * figcaption for AAA body contrast and .cc-label is --muted at 5.03:1, so the
 * semantically tidier <figure>/<figcaption> would fail the build on all three
 * source lines at once. tests/home.mjs asserts this stays a <div>.
 */
export default function Figure({
  label, value, gloss, source,
}: {
  label: string; value: string; gloss: string; source: string;
}) {
  return (
    <div className="cc-fig">
      <div className="cc-label">{label}</div>
      <div className="cc-fig-v">{value}</div>
      <p className="cc-fig-g">{gloss}</p>
      <div className="cc-label cc-fig-s">{source}</div>
    </div>
  );
}
