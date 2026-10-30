# Product detail mapping

The product page maps purchase data directly from Shopify: price, SKU, availability, selected options, and quantity. Product specifications display when the matching product metafields are filled in.

Create these metafield definitions in **Shopify Admin → Settings → Custom data → Products**. Use the `custom` namespace and a single-line text type for each definition:

| Definition name | Key |
| --- | --- |
| Control type | `control_type` |
| Dimensions | `dimensions` |
| Material | `material` |
| Weight | `weight` |
| Power | `power` |
| Voltage | `voltage` |
| In the box | `packing_list` |

Then open each product in **Products**, fill in its metafields with the supplier's verified specifications, and save. Empty fields are hidden on the storefront. Keep shipping origin, delivery estimates, and inventory counts in their Shopify settings unless those values are accurate for the specific product and market.
