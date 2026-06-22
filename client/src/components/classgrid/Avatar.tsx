import * as RadixAvatar from "@radix-ui/react-avatar";

type AvatarSize = "sm" | "md" | "lg";

type CgAvatarProps = {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
};

/**
 * CgAvatar — User display with image + initials fallback.
 *
 * Usage:
 *   <CgAvatar name="Nikhil Shinde" src="/photos/nikhil.jpg" />
 *   <CgAvatar name="Nikhil Shinde" size="lg" />   // shows "NS" initials
 */

const avatarColors = [
  "bg-emerald-500", "bg-emerald-600", "bg-green-500", 
  "bg-green-600", "bg-teal-500", "bg-teal-600"
];

function getAvatarColor(name: string) {
  if (!name) return "bg-emerald-500";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

export function CgAvatar({ name, src, size = "md", className = "" }: CgAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cls = [
    "cg-avatar",
    size !== "md" ? `cg-avatar--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const bgColorClass = src ? "bg-muted" : `${getAvatarColor(name)} text-white`;

  return (
    <RadixAvatar.Root className={`${cls} relative inline-flex items-center justify-center overflow-hidden ${bgColorClass}`}>
      {src ? (
        <RadixAvatar.Image
          alt={name}
          className="cg-avatar__image h-full w-full object-cover"
          src={src}
        />
      ) : null}
      <RadixAvatar.Fallback className="cg-avatar__fallback flex h-full w-full items-center justify-center font-medium" delayMs={src ? 300 : 0}>
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
