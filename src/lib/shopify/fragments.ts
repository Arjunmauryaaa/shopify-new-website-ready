export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    productType
    availableForSale
    tags
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    featuredImage { ...ImageFields }
    images(first: 2) { nodes { ...ImageFields } }
    options { name values optionValues { name swatch { color } } }
    variants(first: 1) { nodes { id availableForSale } }
  }
`;

/** Live stock needs the unauthenticated_read_product_inventory scope; opt in with SHOPIFY_INVENTORY_ENABLED=true. */
const INVENTORY_FIELD = process.env.SHOPIFY_INVENTORY_ENABLED === "true" ? "quantityAvailable" : "";

export const PRODUCT_FULL_FRAGMENT = /* GraphQL */ `
  fragment ProductFullFields on Product {
    ...ProductCardFields
    description
    descriptionHtml
    seo { title description }
    images(first: 25) { nodes { ...ImageFields } }
    options { id name values optionValues { name swatch { color } } }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        ${INVENTORY_FIELD}
        selectedOptions { name value }
        price { ...MoneyFields }
        compareAtPrice { ...MoneyFields }
        image { ...ImageFields }
      }
    }
    media(first: 25) {
      nodes {
        mediaContentType
        alt
        ... on Video {
          sources { url mimeType }
          previewImage { ...ImageFields }
        }
        ... on ExternalVideo {
          embedUrl
          previewImage: previewImage { ...ImageFields }
        }
      }
    }
    care: metafield(namespace: "custom", key: "care") { value }
    materials: metafield(namespace: "custom", key: "materials") { value }
  }
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    buyerIdentity { countryCode }
    cost {
      subtotalAmount { ...MoneyFields }
      totalAmount { ...MoneyFields }
      totalTaxAmount { ...MoneyFields }
    }
    discountCodes { code applicable }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity { ...MoneyFields }
          totalAmount { ...MoneyFields }
          compareAtAmountPerQuantity { ...MoneyFields }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            selectedOptions { name value }
            image { ...ImageFields }
            product { handle title }
          }
        }
      }
    }
  }
`;

export const BASE_FRAGMENTS = MONEY_FRAGMENT + IMAGE_FRAGMENT;
export const CARD_FRAGMENTS = BASE_FRAGMENTS + PRODUCT_CARD_FRAGMENT;
export const FULL_FRAGMENTS = CARD_FRAGMENTS + PRODUCT_FULL_FRAGMENT;
export const CART_FRAGMENTS = BASE_FRAGMENTS + CART_FRAGMENT;
