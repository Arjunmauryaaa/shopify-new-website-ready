import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

type MediaProps = {
  src?: string | null;
  alt: string;
  /** CSS aspect-ratio value, e.g. "4 / 5". Reserves space so there is no layout shift. */
  ratio?: string;
  sizes: string;
  position?: string;
  priority?: boolean;
  className?: string;
  /** Text shown inside the explicit development placeholder. */
  placeholderLabel?: string;
  fill?: boolean;
};

/**
 * Renders a configured/Shopify image, or an explicitly-labelled development placeholder.
 * Placeholders are never presented as product photography.
 */
export function Media({ src, alt, ratio, sizes, position, priority, className = "", placeholderLabel, fill }: MediaProps) {
  const style = fill ? undefined : { aspectRatio: ratio };
  if (!src) {
    return (
      <div className={`media media--placeholder ${className}`} style={style} data-placeholder="true" role="img" aria-label={`${alt} (image placeholder)`}>
        <span>{placeholderLabel ?? "Image placeholder"}</span>
      </div>
    );
  }
  return (
    <div className={`media ${className}`} style={style}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover", objectPosition: position }} />
    </div>
  );
}

export function ShopifyMedia({ image, ...rest }: Omit<MediaProps, "src" | "alt"> & { image: ShopifyImage | null | undefined; alt?: string }) {
  return <Media {...rest} src={image?.url} alt={rest.alt ?? image?.altText ?? ""} />;
}
