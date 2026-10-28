"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ArrowIcon, CloseIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import { formatMoney, isOnSale } from "@/lib/format";
import { findVariant, galleryImages, initialSelection, isColorOption, optionValueState, resolveSelection, type Selection } from "@/lib/variants";
import { brand } from "@/config/brand";
import { track } from "@/lib/analytics";
import { lowStockCount, type ReviewSummary } from "@/lib/commerce";
import { productVideos } from "@/lib/shopify/types";
import { NotifyMe } from "./notify-me";
import { RatingBadge } from "./reviews";
import { SizeGuideButton } from "./size-guide";
import { TrustBlock } from "./trust-block";
import type { Product } from "@/lib/shopify/types";
import { useCart } from "@/providers/cart-provider";
import { useMarket } from "@/providers/market-provider";
import { WishlistButton } from "./wishlist-button";

export function ProductView({ product, variantParam, rating = null }: { product: Product; variantParam?: string; rating?: ReviewSummary | null }) {
  const variants = product.variants.nodes;
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product, variantParam));
  const [quantity, setQuantity] = useState(1);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addItem, buyNow, pending } = useCart();
  const [buying, setBuying] = useState(false);
  const { locale } = useMarket();
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const variant = useMemo(() => findVariant(variants, selection), [variants, selection]);
  const images = useMemo(() => galleryImages(product, variant), [product, variant]);
  const videos = useMemo(() => productVideos(product), [product]);
  const total = images.length + videos.length;
  const video = index >= images.length ? videos[index - images.length] : undefined;
  const lowStock = lowStockCount(variant?.quantityAvailable, brand.commerce.lowStockThreshold);

  useEffect(() => {
    track({ name: "view_item", items: [{ id: product.id, name: product.title, price: Number(product.priceRange.minVariantPrice.amount), currency: product.priceRange.minVariantPrice.currencyCode }] });
  }, [product.id, product.title, product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode]);
  const hasRealOptions = !(product.options.length === 1 && product.options[0].values.length === 1 && product.options[0].name === "Title");
  const adding = pending === "add";
  const canBuy = Boolean(variant?.availableForSale) && !adding;

  // Keep the URL shareable: reflect the selected variant without adding history entries.
  useEffect(() => {
    if (!variant || !hasRealOptions) return;
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant.id.split("/").pop()!);
    window.history.replaceState(null, "", url);
  }, [variant, hasRealOptions]);

  // Sticky mobile purchase bar appears once the main button leaves the viewport.
  useEffect(() => {
    const el = mainButtonRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = images[index] ?? images[0];
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  const touch = useRef<number | null>(null);

  async function handleAdd() {
    if (!variant || !variant.availableForSale) return;
    setMessage(null);
    const ok = await addItem(variant.id, quantity);
    if (!ok) setMessage("We couldn't add this to your bag. Please try again.");
    else track({ name: "add_to_cart", items: [{ id: product.id, name: product.title, price: Number(variant.price.amount), currency: variant.price.currencyCode, variant: variant.title, quantity }] });
  }

  async function handleBuyNow() {
    if (!variant || !variant.availableForSale) return;
    setMessage(null);
    setBuying(true);
    const url = await buyNow(variant.id, quantity);
    if (!url) {
      setBuying(false);
      return setMessage("We couldn't start checkout. Please try again.");
    }
    track({ name: "begin_checkout", value: Number(variant.price.amount) * quantity, currency: variant.price.currencyCode, items: [{ id: product.id, name: product.title, price: Number(variant.price.amount), currency: variant.price.currencyCode, quantity }] });
    window.location.assign(url);
  }

  const sale = variant && isOnSale(variant.compareAtPrice, variant.price);
  const details = [
    { title: "Description", html: product.descriptionHtml },
    product.materials?.value ? { title: "Materials", text: product.materials.value } : null,
    product.care?.value ? { title: "Care", text: product.care.value } : null,
    brand.productInfo.shipping ? { title: "Shipping", text: brand.productInfo.shipping } : null,
    brand.productInfo.returns ? { title: "Returns & exchanges", text: brand.productInfo.returns } : null,
  ].filter(Boolean) as { title: string; html?: string; text?: string }[];

  return (
    <div className="pdp">
      <div className="pdp__gallery" onKeyDown={onKey}>
        <div
          className="pdp__stage"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null || total < 2) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          {video ? (
            <div className="pdp__video" style={{ aspectRatio: "4 / 5" }}>
              {video.kind === "file" ? (
                <video controls playsInline preload="metadata" poster={video.poster?.url} aria-label={video.alt || `${product.title} video`}>
                  {video.sources.map((src) => <source key={src.url} src={src.url} type={src.mimeType} />)}
                </video>
              ) : (
                <iframe src={video.embedUrl} title={video.alt || `${product.title} video`} allow="fullscreen; picture-in-picture" loading="lazy" />
              )}
            </div>
          ) : (
            <button type="button" className="pdp__zoom" onClick={() => setZoom(true)} aria-label="View image full screen" aria-haspopup="dialog">
              <Media src={current?.url} alt={current?.altText || product.title} ratio="4 / 5" sizes="(min-width: 1024px) 50vw, 100vw" position="50% 30%" priority />
            </button>
          )}
          {total > 1 && (
            <>
              <button type="button" className="pdp__nav pdp__nav--prev" aria-label="Previous image" onClick={() => go(-1)}><ArrowIcon /></button>
              <button type="button" className="pdp__nav pdp__nav--next" aria-label="Next image" onClick={() => go(1)}><ArrowIcon /></button>
              <p className="pdp__counter small" aria-live="polite">{index + 1} / {total}</p>
            </>
          )}
        </div>
        {total > 1 && (
          <ul className="pdp__thumbs" aria-label="Product images and video">
            {images.map((img, i) => (
              <li key={img.url}>
                <button type="button" aria-label={`Show image ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}>
                  <Media src={img.url} alt="" ratio="4 / 5" sizes="96px" />
                </button>
              </li>
            ))}
            {videos.map((v, i) => (
              <li key={`video-${i}`}>
                <button type="button" aria-label={`Play video ${i + 1}`} aria-current={images.length + i === index} onClick={() => setIndex(images.length + i)} className="thumb-video">
                  <Media src={v.poster?.url} alt="" ratio="4 / 5" sizes="96px" placeholderLabel="Video" />
                  <span aria-hidden="true">▶</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pdp__info">
        <div className="pdp__head">
          <div>
            {product.vendor && <p className="label">{product.vendor}</p>}
            <h1 className="pdp__title">{product.title}</h1>
            <RatingBadge summary={rating} />
          </div>
          <WishlistButton handle={product.handle} title={product.title} variant="inline" />
        </div>

        <p className="pdp__price" data-testid="price">
          {sale && <s className="muted">{formatMoney(variant!.compareAtPrice, locale)}</s>} <span>{formatMoney(variant?.price ?? product.priceRange.minVariantPrice, locale)}</span>
        </p>

        {hasRealOptions &&
          product.options.map((option) => (
            <fieldset key={option.name} className="options">
              <legend className="label">
                {option.name}: <span className="options__current">{selection[option.name]}</span>
              </legend>
              {/size/i.test(option.name) && (
                <SizeGuideButton onPick={(size) => option.values.includes(size) && setSelection((s) => resolveSelection(variants, s, option.name, size))} />
              )}
              <div className="options__values" role="radiogroup" aria-label={option.name}>
                {option.values.map((value) => {
                  const state = optionValueState(variants, selection, option.name, value);
                  const checked = selection[option.name] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      disabled={state === "unavailable"}
                      className={`opt ${isColorOption(option.name) ? "opt--color" : ""} ${state === "sold-out" ? "is-soldout" : ""}`}
                      onClick={() => {
                        setSelection((s) => resolveSelection(variants, s, option.name, value));
                        setIndex(0); // the chosen variant's own image leads the gallery
                      }}
                    >
                      {value}
                      {state === "sold-out" && <span className="visually-hidden"> (sold out)</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

        <div className="pdp__buy">
          <div className="stepper" role="group" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <button ref={mainButtonRef} type="button" className="btn btn--solid btn--block" disabled={!canBuy} onClick={handleAdd} data-testid="add-to-cart">
            {adding ? "Adding…" : !variant ? "Select options" : variant.availableForSale ? "Add to bag" : "Sold out"}
          </button>
        </div>
        {variant?.availableForSale && (
          <button type="button" className="btn btn--outline btn--block" disabled={!canBuy || buying} onClick={handleBuyNow} data-testid="buy-now">
            {buying ? "Redirecting…" : "Buy it now"}
          </button>
        )}
        {lowStock !== null && <p className="small" data-testid="low-stock">Only {lowStock} left</p>}
        {variant && !variant.availableForSale && <NotifyMe variantId={variant.id} />}
        <p role="alert" className="form-error small">{message}</p>
        <TrustBlock />

        <div className="details">
          {details.map((d, i) => (
            <details key={d.title} open={i === 0}>
              <summary>{d.title}</summary>
              {d.html ? <div className="prose" dangerouslySetInnerHTML={{ __html: d.html }} /> : <p>{d.text}</p>}
            </details>
          ))}
        </div>
      </div>

      {showSticky && (
        <div className="sticky-buy" role="region" aria-label="Quick purchase">
          <span className="sticky-buy__price">{formatMoney(variant?.price ?? product.priceRange.minVariantPrice, locale)}</span>
          <button type="button" className="btn btn--solid" disabled={!canBuy} onClick={handleAdd}>
            {adding ? "Adding…" : variant?.availableForSale ? "Add to bag" : "Sold out"}
          </button>
        </div>
      )}

      <Dialog open={zoom} onClose={() => setZoom(false)} side="full" label="Image viewer" className="zoom-dialog">
        <div className="zoom" onKeyDown={onKey}>
          <button type="button" className="icon-btn zoom__close" aria-label="Close image viewer" onClick={() => setZoom(false)}><CloseIcon /></button>
          <Media src={current?.url} alt={current?.altText || product.title} sizes="100vw" fill className="zoom__img" />
          {images.length > 1 && (
            <>
              <button type="button" className="pdp__nav pdp__nav--prev" aria-label="Previous image" onClick={() => go(-1)}><ArrowIcon /></button>
              <button type="button" className="pdp__nav pdp__nav--next" aria-label="Next image" onClick={() => go(1)}><ArrowIcon /></button>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
