import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatDate, formatTime } from './dateHelpers';

/**
 * Formats a clean receipt ID string (e.g., #INV-1024 or #INV-20260802-1024).
 */
export function formatReceiptId(saleId, createdAt) {
  if (!saleId) return '#INV-0000';
  const cleanId = String(saleId).slice(-4);
  return `#INV-${cleanId}`;
}

/**
 * Safely escapes HTML special characters to prevent injection issues in generated receipts.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates clean, professional monochrome HTML markup for the invoice matching the in-app modal.
 */
export function generateReceiptHTML({
  sale,
  storeInfo,
  currency,
  exchangeRate,
  locale,
  t,
  formatCurrency,
}) {
  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);
  const formattedDate = formatDate(sale.createdAt, locale);
  const formattedTime = formatTime(sale.createdAt, locale);
  const storeName = storeInfo?.name || t('default_store_name');
  const storePhone = storeInfo?.phone || t('default_store_phone');
  const storeAddress = storeInfo?.address || t('default_store_address');
  const storeNote = storeInfo?.note || t('default_store_note');

  const mainTotal = formatCurrency(sale.totalPrice);
  const itemsList = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items
    : [{ productName: sale.productName, quantity: sale.quantity, unitPrice: sale.unitPrice, totalPrice: sale.totalPrice }];

  const isUSD = currency === 'USD';
  const rate = exchangeRate || 4000;
  let altTotal = '';
  if (isUSD) {
    const rielVal = Math.round(sale.totalPrice * rate);
    altTotal = `${rielVal.toLocaleString()} ៛`;
  } else {
    const usdVal = (sale.totalPrice / (rate || 1)).toFixed(2);
    altTotal = `$${usdVal}`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${t('invoice_title')} - ${receiptNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #ffffff;
            color: #000000;
            padding: 10px;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
          }
          .receipt-container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }
          .brand-accent {
            height: 5px;
            background-color: #000000;
          }
          .header {
            padding: 24px 28px 16px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }
          .store-name {
            font-size: 24px;
            font-weight: 900;
            color: #000000;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }
          .store-detail {
            font-size: 12px;
            color: #4b5563;
            margin-top: 2px;
          }
          .receipt-title-badge {
            display: inline-block;
            margin-top: 12px;
            background-color: #000000;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-grid {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 28px;
            border-bottom: 1px solid #e5e7eb;
          }
          .meta-item-label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-item-val {
            font-size: 13px;
            font-weight: 700;
            color: #000000;
            margin-top: 2px;
          }
          .status-paid {
            color: #000000;
            font-weight: 800;
          }
          .content-body {
            padding: 20px 28px 28px;
          }
          .items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px 0;
            margin-bottom: 16px;
          }
          .th-box {
            background-color: #000000;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 9px 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
          }
          .th-box.left { text-align: center; }
          .th-box.center { text-align: center; }
          .th-box.right { text-align: center; }
          .items-table td {
            padding: 12px 6px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .items-table td.left { text-align: left; }
          .items-table td.center { text-align: center; }
          .items-table td.right { text-align: right; }
          .item-name {
            font-size: 13px;
            font-weight: 700;
            color: #000000;
          }
          .item-qty {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
          }
          .item-unit-price {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
          }
          .item-total {
            font-size: 13px;
            font-weight: 800;
            color: #000000;
          }
          .summary-container {
            width: 60%;
            margin-left: auto;
            padding-top: 8px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            font-size: 13px;
            color: #374151;
          }
          .summary-row.total {
            font-size: 15px;
            font-weight: 900;
            color: #000000;
            padding-top: 8px;
            margin-top: 4px;
            border-top: 1px solid #000000;
          }
          .summary-total-label {
            font-weight: 900;
            color: #000000;
          }
          .summary-total-val {
            font-size: 17px;
            font-weight: 900;
            color: #000000;
          }
          .alt-curr-note {
            text-align: right;
            font-size: 12px;
            color: #4b5563;
            font-weight: 600;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px dashed #d1d5db;
          }
          .thank-you {
            font-size: 12px;
            font-style: italic;
            font-weight: 700;
            color: #000000;
            margin-bottom: 4px;
          }
          .app-tagline {
            font-size: 10px;
            color: #6b7280;
          }
          .barcode {
            margin-top: 10px;
            font-family: monospace;
            font-size: 13px;
            letter-spacing: 4px;
            color: #000000;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="brand-accent"></div>
          
          <div class="header">
            <div class="store-name">${escapeHtml(storeName)}</div>
            ${storePhone ? `<div class="store-detail">📞 ${escapeHtml(storePhone)}</div>` : ''}
            ${storeAddress ? `<div class="store-detail">📍 ${escapeHtml(storeAddress)}</div>` : ''}
            <div class="receipt-title-badge">${t('invoice_title')}</div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-item-label">${t('receipt_no')}</div>
              <div class="meta-item-val">${receiptNo}</div>
            </div>
            <div style="text-align: right;">
              <div class="meta-item-label">${t('invoice_date')}</div>
              <div class="meta-item-val">${formattedDate} ${formattedTime}</div>
            </div>
          </div>

          <div class="meta-grid" style="border-top: none;">
            <div>
              <div class="meta-item-label">${t('pay_method_label')}</div>
              <div class="meta-item-val">${sale.paymentMethod === 'khqr' ? t('pay_method_khqr') : t('pay_method_cash')}</div>
            </div>
            <div style="text-align: right;">
              <div class="meta-item-label">Status</div>
              <div class="meta-item-val status-paid">✓ ${t('invoice_status_paid')}</div>
            </div>
          </div>

          <div class="content-body">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="th-box left" style="width: 45%;">${t('tbl_name_of_items')}</th>
                  <th class="th-box center" style="width: 15%;">${t('tbl_quantity')}</th>
                  <th class="th-box right" style="width: 20%;">${t('tbl_price_per_unit')}</th>
                  <th class="th-box right" style="width: 20%;">${t('tbl_total_price')}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList.map((item) => `
                  <tr>
                    <td class="left">
                      <div class="item-name">${escapeHtml(item.productName)}</div>
                    </td>
                    <td class="center item-qty">${item.quantity}</td>
                    <td class="right item-unit-price">${formatCurrency(item.unitPrice)}</td>
                    <td class="right item-total">${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-container">
              <div class="summary-row">
                <span>${t('tbl_subtotal')}</span>
                <span style="font-weight: 700; color: #000;">${mainTotal}</span>
              </div>
              <div class="summary-row">
                <span>${t('tbl_tax')}</span>
                <span>$0.00</span>
              </div>
              <div class="summary-row total">
                <span class="summary-total-label">${t('tbl_grand_total')}</span>
                <span class="summary-total-val">${mainTotal}</span>
              </div>
              ${altTotal ? `<div class="alt-curr-note">(${t('invoice_dual_curr')}: ${altTotal})</div>` : ''}
            </div>

            <div class="footer">
              <div class="thank-you">${escapeHtml(storeNote)}</div>
              <div class="app-tagline">GoStock POS Inventory — Digital Receipt</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Formats a clean text representation of the invoice for messaging apps (Telegram, WhatsApp, SMS).
 */
export function generateReceiptText({ sale, storeInfo, currency, exchangeRate, locale, t, formatCurrency }) {
  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);
  const formattedDate = formatDate(sale.createdAt, locale);
  const formattedTime = formatTime(sale.createdAt, locale);
  const storeName = storeInfo?.name || t('default_store_name');
  const storePhone = storeInfo?.phone || t('default_store_phone');
  const storeNote = storeInfo?.note || t('default_store_note');

  const mainTotal = formatCurrency(sale.totalPrice);
  const isUSD = currency === 'USD';
  const rate = exchangeRate || 4000;
  let altTotal = '';
  if (isUSD) {
    const rielVal = Math.round(sale.totalPrice * rate);
    altTotal = `${rielVal.toLocaleString()} ៛`;
  } else {
    const usdVal = (sale.totalPrice / (rate || 1)).toFixed(2);
    altTotal = `$${usdVal}`;
  }

  const itemsList = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items
    : [{ productName: sale.productName, quantity: sale.quantity, unitPrice: sale.unitPrice, totalPrice: sale.totalPrice }];

  const itemsText = itemsList
    .map((item) => `🛍️ *${item.productName}*\n   ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}`)
    .join('\n');

  const pmText = sale.paymentMethod === 'khqr' ? t('pay_method_khqr') : t('pay_method_cash');

  return `🧾 *${storeName}*
------------------------------
📌 ${t('receipt_no')}: ${receiptNo}
📅 ${t('invoice_date')}: ${formattedDate} ${formattedTime}
📞 Phone: ${storePhone}
💳 ${t('pay_method_label')}: ${pmText}
------------------------------
${itemsText}
------------------------------
💵 *${t('invoice_total')}: ${mainTotal}*
(${t('invoice_dual_curr')}: ${altTotal})
------------------------------
🙏 ${storeNote}`;
}

/**
 * Triggers native print dialog or web window.print().
 */
export async function printInvoiceAsync(options) {
  const html = generateReceiptHTML(options);
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } else {
    await Print.printAsync({ html });
  }
}

/**
 * Generates a PDF file from the invoice HTML and presents native download/save prompt.
 */
export async function downloadPDFAsync(options) {
  const html = generateReceiptHTML(options);
  if (Platform.OS === 'web') {
    await printInvoiceAsync(options);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const filename = `Invoice_${formatReceiptId(options.sale?.saleId, options.sale?.createdAt)}.pdf`;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: options.t ? options.t('download_pdf_title') : 'Download PDF Invoice',
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert('PDF Created', `Saved to ${uri}`);
  }
}

/**
 * Shares formatted invoice text via native share sheet (Telegram, WhatsApp, SMS).
 */
export async function shareInvoiceAsync(options) {
  const text = generateReceiptText(options);
  if (await Sharing.isAvailableAsync()) {
    // Save to temp text file or share plain string
    const html = generateReceiptHTML(options);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: options.t ? options.t('share_invoice') : 'Share Receipt',
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert('Share Invoice', text);
  }
}
