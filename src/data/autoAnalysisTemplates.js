import { MATERIAL_LIBRARY, LABOR_LIBRARY, EQUIPMENT_LIBRARY, TRANSPORT_LIBRARY } from './resourceLibrary';

const norm = (v='') => v.toLocaleLowerCase('tr-TR');
const find = (lib, words) => lib.find(x => words.some(w => norm(`${x.ad} ${x.kategori}`).includes(norm(w))));

export function buildAutoAnalysis(row) {
  const text = norm(`${row?.description || ''} ${row?.category || ''}`);
  const out = { materials: [], labors: [], equipments: [], transports: [] };
  const push = (key, item, consumption, wastePercent=0) => item && out[key].push({ item, consumption, wastePercent });

  if (text.includes('beton')) {
    push('materials', find(MATERIAL_LIBRARY, ['hazır beton c25/30','hazır beton']), 1.02, 2);
    push('labors', find(LABOR_LIBRARY, ['beton işçisi','düz işçi']), 0.18);
    push('equipments', find(EQUIPMENT_LIBRARY, ['beton pompası','vibratör']), 0.08);
  } else if (text.includes('kalıp')) {
    push('materials', find(MATERIAL_LIBRARY, ['plywood','kalıp']), 0.35, 5);
    push('materials', find(MATERIAL_LIBRARY, ['kereste']), 0.08, 5);
    push('labors', find(LABOR_LIBRARY, ['kalıpçı']), 0.75);
  } else if (text.includes('donatı') || text.includes('demir')) {
    push('materials', find(MATERIAL_LIBRARY, ['nervürlü inşaat çeliği','donatı çeliği']), 1.03, 3);
    push('labors', find(LABOR_LIBRARY, ['demirci']), 0.03);
  } else if (text.includes('alçıpan') || text.includes('bölme duvar')) {
    push('materials', find(MATERIAL_LIBRARY, ['alçıpan levha','alçı levha']), 2.1, 5);
    push('materials', find(MATERIAL_LIBRARY, ['c profil']), 2.2, 5);
    push('materials', find(MATERIAL_LIBRARY, ['u profil']), 0.8, 5);
    push('materials', find(MATERIAL_LIBRARY, ['taş yünü']), 1.05, 5);
    push('labors', find(LABOR_LIBRARY, ['alçıpan ustası']), 0.55);
  } else if (text.includes('boya')) {
    push('materials', find(MATERIAL_LIBRARY, ['iç cephe boya','boya']), 0.22, 5);
    push('materials', find(MATERIAL_LIBRARY, ['astar']), 0.10, 5);
    push('labors', find(LABOR_LIBRARY, ['boyacı']), 0.35);
  } else if (text.includes('seramik') || text.includes('fayans')) {
    push('materials', find(MATERIAL_LIBRARY, ['seramik']), 1.05, 5);
    push('materials', find(MATERIAL_LIBRARY, ['seramik yapıştırıcı','yapıştırıcı']), 4.5, 5);
    push('materials', find(MATERIAL_LIBRARY, ['derz']), 0.35, 5);
    push('labors', find(LABOR_LIBRARY, ['seramik ustası']), 0.55);
  } else if (text.includes('sıva')) {
    push('materials', find(MATERIAL_LIBRARY, ['hazır sıva','alçı']), 12, 5);
    push('labors', find(LABOR_LIBRARY, ['sıvacı']), 0.4);
  } else if (text.includes('şap')) {
    push('materials', find(MATERIAL_LIBRARY, ['şap betonu','çimento']), 0.05, 3);
    push('materials', find(MATERIAL_LIBRARY, ['kum 0-3']), 0.04, 3);
    push('labors', find(LABOR_LIBRARY, ['şap ustası','düz işçi']), 0.3);
  } else if (text.includes('kazı') || text.includes('hafriyat')) {
    push('equipments', find(EQUIPMENT_LIBRARY, ['ekskavatör']), 0.05);
    push('transports', find(TRANSPORT_LIBRARY, ['hafriyat','kamyon']), 0.12);
    push('labors', find(LABOR_LIBRARY, ['düz işçi']), 0.03);
  }
  return out;
}
