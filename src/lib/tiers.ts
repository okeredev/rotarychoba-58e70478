export type TierKey = "standard" | "premium" | "vip";

export const TIERS: Array<{
  key: TierKey;
  name: string;
  amount: number;
  tagline: string;
  perks: string[];
  payAtVenue: boolean;
}> = [
  {
    key: "standard",
    name: "Regular",
    amount: 10000,
    tagline: "General attendance",
    perks: ["Access to the ceremony", "Cocktail reception", "Softcopy of event brochure"],
    payAtVenue: true,
  },
  {
    key: "premium",
    name: "Gold",
    amount: 20000,
    tagline: "Attendance + brochure & souvenir",
    perks: [
      "Access to the ceremony",
      "Hardcopy of event brochure",
      "Custom event souvenir",
      "Reserved seating",
    ],
    payAtVenue: true,
  },
  {
    key: "vip",
    name: "Platinum",
    amount: 50000,
    tagline: "The full Rotary experience",
    perks: [
      "Access to the ceremony",
      "Hardcopy of event brochure",
      "Exclusive souvenir & special gifts",
      "VIP seating & recognition",
    ],
    payAtVenue: false,
  },
];

export const formatNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export const EVENT = {
  name: "16th Installation Ceremony",
  club: "Rotary Club of Choba-Uniport",
  date: "Friday, 3rd July 2026 · 3:00pm prompt",
  venue: "Helena Haven Hotel, East-West Road, Choba, Rivers State",
};
