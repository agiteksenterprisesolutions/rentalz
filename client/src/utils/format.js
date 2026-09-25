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

export const OPERATOR_LABELS = { WITH_OPERATOR: "With operator", WITHOUT_OPERATOR: "Without operator", BOTH: "With or without operator" };
export const yesNo = (value) => (value === true ? "Yes" : value === false ? "No" : null);
