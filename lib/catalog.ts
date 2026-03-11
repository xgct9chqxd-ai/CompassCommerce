export type ProductId = "compass_tricomp";

export type Product = {
  id: ProductId;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  hero: string;
  releaseStage: string;
  licenseType: "perpetual";
  machineLimit: number;
  offlineGraceDays: number;
  whatYouGet: string[];
  activationFlow: string[];
  storefrontNotes: string[];
};

const productCatalog: Record<ProductId, Product> = {
  compass_tricomp: {
    id: "compass_tricomp",
    slug: "tri-comp",
    name: "Compass Tri-Comp",
    tagline: "Three-band dynamics with the licensing path already proven on a real VM.",
    summary:
      "The product surface is ready for checkout, entitlement provisioning, and installer activation without reopening the licensing-core design.",
    hero:
      "Ship the product page now, wire payments next, and keep the same backend contract for activation, refresh, revoke, and offline issuance.",
    releaseStage: "Backend validated on Ubuntu VM",
    licenseType: "perpetual",
    machineLimit: 2,
    offlineGraceDays: 30,
    whatYouGet: [
      "Perpetual license with signed machine-bound payloads",
      "Two active machine slots with revoke support",
      "Thirty-day offline grace window after successful activation",
      "Installer-compatible activate and refresh endpoints",
    ],
    activationFlow: [
      "Provision entitlement after confirmed payment",
      "Installer calls activate with product id, entitlement id, and machine hash",
      "Backend returns signed license payload for local verification",
      "Refresh extends the offline grace window without changing the entitlement id",
    ],
    storefrontNotes: [
      "Checkout is Stripe-ready but still waiting on real keys and price ids",
      "Operator provisioning works once the website shares the admin token with the backend",
      "Customer auth and purchase history still need a dedicated commerce identity layer",
    ],
  },
};

export const catalog = Object.values(productCatalog);

export function getProduct(productId: string): Product | null {
  return productCatalog[productId as ProductId] ?? null;
}
