// Limpia strings tipo "$ 4.850,88"
export const parseArgentineValue = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === 'number') return value;
  
  let clean = value.toString()
    .replace(/\s/g, '')
    .replace(/\$/g, '')
    .replace(/[^0-9.,-]/g, '');

  if (!clean) return 0;

  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// LA LÓGICA QUE PIDE EL CLIENTE (Dando $ 5.959,30 para el Latex Amarillo)
export const calculatePublicPrice = (supplierUnit, settings) => {
  const base = parseFloat(supplierUnit) || 0;
  const descPercent = parseFloat(settings.descuento) || 0;
  const utilPercent = parseFloat(settings.utilidad) || 0;

  // 1. COSTO NETO (Precio lista - Descuento del mayorista)
  const netCost = base * (1 - (descPercent / 100));

  // 2. SUMA LINEAL DE IMPUESTOS (21% IVA + 5% IIBB = 26%)
  let taxFactor = 0;
  if (settings.iva) taxFactor += 0.21;
  if (settings.iibb) taxFactor += 0.05;

  const costWithTax = netCost * (1 + taxFactor);

  // 3. UTILIDAD SOBRE EL COSTO FINAL
  const finalPrice = costWithTax * (1 + (utilPercent / 100));

  return finalPrice;
};