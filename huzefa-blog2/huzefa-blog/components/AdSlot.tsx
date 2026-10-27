type Props = {
  /** Human-readable name of the placement, e.g. "in-article-1". */
  slot: string;
  className?: string;
};

/**
 * Empty container reserved for a Google AdSense ad unit.
 *
 * TODO (after AdSense approval):
 *   1. Add the AdSense <script> to app/layout.tsx.
 *   2. Replace the comment below with your <ins class="adsbygoogle" …> unit
 *      and call (adsbygoogle = window.adsbygoogle || []).push({}) in a client component.
 *   3. Give the div a min-height matching the ad size to avoid layout shift.
 */
export default function AdSlot({ slot, className = "" }: Props) {
  return (
    <div data-ad-slot={slot} className={`ad-slot my-8 ${className}`} aria-hidden="true">
      {/* ADSENSE AD UNIT GOES HERE — placement: {slot} */}
    </div>
  );
}
