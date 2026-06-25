// Visory "v" brand mark, recreated as SVG from the brand logo. Uses currentColor
// so it can render white inside the magenta tile or magenta on light surfaces.
// To use the official asset instead, drop it at /public/visory-mark.svg and
// swap this for an <img src="/visory-mark.svg" />.
export function VisoryMark({
  size = 20,
  className,
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <path d="M5 11 L19.5 35 L36 7 L28.5 7 L19.5 24 L12 11 Z" fill={color} />
    </svg>
  );
}
