// One-time import of the original Google Sheet, corrected against the Bambu order-confirmation
// emails (Dec 26/28/29 2025, May 7/13 2026, Oct 18 2026). Loaded only when the
// "Import my spreadsheet" button is pressed on an empty tracker. Swatch hexes are approximate
// Bambu colors — edit any filament to fine-tune.
// Prices are the sale price per spool before tax, exactly as on the receipt. Tax is the
// receipt's figure (Bambu rounds per line, so it can be a cent off 6% of the subtotal).
// Tracking numbers and arrival dates come from the sheet (the confirmation emails don't have them).
window.FILAMENT_SEED = (function () {
  const F = (code, name, material, hex, flag, hex2) =>
    ({ kind: 'filament', id: 'f-' + code, code: String(code), name, material, brand: 'Bambu Lab', hex, hex2: hex2 || '', flag: flag || '' });
  const filaments = [
    F(10205, 'Maroon Red', 'PLA Basic', '#9D2235', 'want'),
    F(10200, 'Red', 'PLA Basic', '#C12E1F'),
    F(11201, 'Sakura Pink', 'PLA Matte', '#E8AFCF'),
    F(10203, 'Pink', 'PLA Basic', '#F55A74'),
    F(10204, 'Hot Pink', 'PLA Basic', '#F5547C', 'want'),
    F(10202, 'Magenta', 'PLA Basic', '#EC008C'),
    F(10300, 'Orange', 'PLA Basic', '#FF6A13'),
    F(10400, 'Yellow', 'PLA Basic', '#F4EE2A'),
    F(10402, 'Sunflower Yellow', 'PLA Basic', '#FEC600'),
    F(10501, 'Bambu Green', 'PLA Basic', '#00AE42'),
    F(10502, 'Mistletoe Green', 'PLA Basic', '#3F8E43'),
    F(10605, 'Turquoise', 'PLA Basic', '#00B1B7'),
    F(10603, 'Cyan', 'PLA Basic', '#0086D6'),
    F(10604, 'Cobalt Blue', 'PLA Basic', '#0056B8'),
    F(10601, 'Blue', 'PLA Basic', '#0A2989'),
    F(10700, 'Purple', 'PLA Basic', '#5E43B7'),
    F(10701, 'Indigo Purple', 'PLA Basic', '#482960'),
    F(10201, 'Beige', 'PLA Basic', '#F7E6DE', 'want'),
    F(10800, 'Brown', 'PLA Basic', '#9D432C'),
    F(10802, 'Cocoa Brown', 'PLA Basic', '#6F5034'),
    F(10104, 'Light Gray', 'PLA Basic', '#D1D3D5'),
    F(10602, 'Blue Gray', 'PLA Basic', '#5B6579'),
    F(10103, 'Gray', 'PLA Basic', '#8E9089'),
    F(10105, 'Dark Gray', 'PLA Basic', '#545454'),
    F(10102, 'Silver', 'PLA Basic', '#A6A9AA'),
    F(10101, 'Black', 'PLA Basic', '#111111'),   // was 'need' in the sheet — covered by the Oct 2026 order
    F(10100, 'Jade White', 'PLA Basic', '#F4F4F0'),
    F(11101, 'Charcoal', 'PLA Matte', '#3A3A3C'),
    F(13902, 'Midnight Blaze', 'PLA Silk Multi-Color', '#1D3FBF', '', '#C8102E'),
    F(13916, 'Phantom Blue', 'PLA Silk Multi-Color', '#00629B', '', '#1A1A1A'),
    F(65104, 'Support for PLA', 'Support for PLA', '#E9E6DA', 'need')
  ];
  const I = (code, price, qty) => ({ fid: 'f-' + code, qty: qty || 1, price, grams: 1000 });
  const spools = (qty, price) => [{ name: 'Bambu Reusable Spool (Low Temp)', qty, price }];
  const orders = [
    { kind: 'order', id: 'o-20251226', orderNo: 'us681217365927149569', date: '2025-12-26', vendor: 'Bambu Lab', taxRate: 6, tax: 10.24,
      items: [I(13902, 22.49), I(10700, 13.99), I(10604, 13.99), I(10501, 13.99), I(10200, 16.09), I(10103, 13.99),
              I(10101, 13.99), I(10100, 13.99)],
      extras: spools(6, 7.99),
      shipments: [{ number: '887443760723', carrier: 'FedEx', eta: '2025-12-31', received: '2025-12-31' },
                  { number: '1ZC6J5620316595757', carrier: 'UPS', eta: '2026-01-07', received: '2026-01-07' }],
      notes: 'Midnight Blaze and Red came with a spool; the rest are refills. Receipt total $180.70.' },
    { kind: 'order', id: 'o-20251228', orderNo: 'us681956154556006400', date: '2025-12-28', vendor: 'Bambu Lab', taxRate: 6, tax: 7.92,
      items: [I(10104, 13.99), I(10602, 13.99), I(10203, 13.99), I(10603, 13.99), I(10800, 13.99), I(10300, 13.99)],
      extras: spools(6, 7.99),
      shipments: [{ number: '1ZC6J5620311435858', carrier: 'UPS', eta: '2026-01-08', received: '2026-01-07' }],
      notes: 'All refills. Receipt total $139.80.' },
    { kind: 'order', id: 'o-20251229', orderNo: 'us682167831873114113', date: '2025-12-29', vendor: 'Bambu Lab', taxRate: 6, tax: 5.79,
      items: [I(13916, 22.49), I(10502, 19.99), I(10701, 19.99), I(10400, 19.99)],
      extras: spools(3, 7.99), discount: 10,
      shipments: [{ number: '1ZXJ33010306353188', carrier: 'UPS', eta: '2026-01-03', received: '2026-01-03' },
                  { number: '1ZC6J5620324924126', carrier: 'UPS', eta: '2026-01-09', received: '2026-01-07' }],
      notes: 'Phantom Blue came with a spool; the rest are refills (not on the bulk sale). $10 subscription discount. Receipt total $102.22.' },
    { kind: 'order', id: 'o-20260507', orderNo: 'us729011898635612161', date: '2026-05-07', vendor: 'Bambu Lab', taxRate: 6, tax: 8.16,
      items: [I(10202, 12.99), I(11201, 12.99), I(10802, 14.94), I(10601, 14.94), I(10100, 12.99), I(10402, 14.94),
              I(10102, 12.99), I(10105, 12.99), I(10101, 12.99), I(10605, 12.99)],
      shipments: [],
      notes: 'Cocoa Brown, Blue and Sunflower Yellow came with a spool; the rest are refills. Receipt total $143.91. No tracking or arrival date recorded.' },
    { kind: 'order', id: 'o-20260513', orderNo: 'us731077813164539905', date: '2026-05-13', vendor: 'Bambu Lab', taxRate: 6, tax: 3.60,
      items: [], extras: spools(5, 11.99), shipping: 6.99,
      shipments: [],
      notes: 'Reusable spools only (full price, no bundle deal). Tax was not charged on shipping. Receipt total $70.54.' },
    { kind: 'order', id: 'o-20261018', orderNo: 'us788376212614414337', date: '2026-10-18', vendor: 'Bambu Lab', taxRate: 6, tax: 6.46,
      items: [I(11101, 16.1425, 4), I(10101, 13.59, 2)],
      extras: spools(2, 7.99),
      shipments: [],
      notes: 'Charcoal came with spools ($64.57 for 4); Black are refills. Receipt total $114.19.' }
  ];
  return { filaments, orders };
})();
