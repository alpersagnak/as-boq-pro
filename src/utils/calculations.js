const number = (value) => Number(value) || 0;

export const materialContribution = (item) =>
  number(item.consumption) *
  number(item.unitPrice) *
  (1 + number(item.wastePercent) / 100);

export const laborContribution = (item) =>
  number(item.consumption) * number(item.unitPrice);

export const equipmentContribution = (item) =>
  number(item.consumption) * number(item.unitPrice);

export const transportContribution = (item) =>
  number(item.consumption) * number(item.unitPrice);

export function analyzeBoqRow(row) {
  const material = (row.materials || []).reduce(
    (sum, item) => sum + materialContribution(item),
    0
  );
  const labor = (row.labors || []).reduce(
    (sum, item) => sum + laborContribution(item),
    0
  );
  const equipment = (row.equipments || []).reduce(
    (sum, item) => sum + equipmentContribution(item),
    0
  );
  const transport = (row.transports || []).reduce(
    (sum, item) => sum + transportContribution(item),
    0
  );

  const settings = row.analysisSettings || {};
  const directCost = material + labor + equipment + transport;
  const siteOverhead = directCost * (number(settings.siteOverheadPercent) / 100);
  const generalOverheadBase = directCost + siteOverhead;
  const generalOverhead =
    generalOverheadBase * (number(settings.generalOverheadPercent) / 100);
  const profitBase = generalOverheadBase + generalOverhead;
  const profit = profitBase * (number(settings.profitPercent) / 100);
  const total = profitBase + profit;

  return {
    material,
    labor,
    equipment,
    transport,
    directCost,
    siteOverhead,
    generalOverhead,
    profit,
    total,
  };
}

export function projectTotal(project) {
  return (project?.boqRows || []).reduce(
    (sum, row) => sum + number(row.quantity) * analyzeBoqRow(row).total,
    0
  );
}

export const formatMoney = (value, currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(number(value));

export const normalizeText = (value) =>
  String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
