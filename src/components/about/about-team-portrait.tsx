import Image from "next/image";
import { getAboutTeamPortraitSrc } from "@/lib/about-team-media";

type AboutTeamPortraitProps = {
  fileName: string;
  alt: string;
  priority?: boolean;
};

export function AboutTeamPortrait({
  fileName,
  alt,
  priority = false,
}: AboutTeamPortraitProps) {
  return (
    <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
      <Image
        src={getAboutTeamPortraitSrc(fileName)}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1152px) 45vw, 520px"
        className="object-cover object-center"
        unoptimized
      />
    </div>
  );
}
