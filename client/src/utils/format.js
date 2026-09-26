export const formatAed = (value) => `AED ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const AD_TYPE_LABELS = { RENT: "For rent", SELL: "For sale", PREMIUM: "Premium", PRODUCT: "Product" };

/** Headline price of an ad card: the daily rate if there is one, else weekly, monthly, else the plain price. */
export const getAdPrice = (ad) => {
  const tiers = [
    [ad.dailyPrice, "/ day"],
    [ad.weeklyPrice, "/ week"],
    [ad.monthlyPrice, "/ month"],
  ];
  const [amount, unit] = tiers.find(([value]) => Number(value) > 0) ?? [ad.price, ""];
  return { text: formatAed(amount), unit };
};

/** File size for attachment chips: 0 B, 812 KB, 4.2 MB. */
export const formatBytes = (bytes) => {
  if (!Number(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(power === 0 || value >= 10 ? 0 : 1)} ${units[power]}`;
};

export const OPERATOR_LABELS = { WITH_OPERATOR: "With operator", WITHOUT_OPERATOR: "Without operator", BOTH: "With or without operator" };
export const yesNo = (value) => (value === true ? "Yes" : value === false ? "No" : null);
