import { Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatDate, formatTime } from './dateHelpers';

/**
 * Generate formatted Receipt ID string
 * e.g., INV-20260802-1234
 */
export function formatReceiptId(saleId, createdAt) {
  if (!saleId) return 'INV-000000';
  const dateStr = createdAt ? new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '') : '';
  const shortId = saleId.slice(-6);
  return `INV-${dateStr ? dateStr + '-' : ''}${shortId}`;
}

/**
 * Generate print-ready HTML for thermal receipt printers & high-resolution PDF downloads.
 */
export function generateReceiptHTML({ sale, storeInfo, currency, exchangeRate, locale, t, formatCurrency }) {
  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);
  const formattedDate = formatDate(sale.createdAt, locale);
  const formattedTime = formatTime(sale.createdAt, locale);
  const storeName = storeInfo?.name || t('default_store_name');
  const storePhone = storeInfo?.phone || t('default_store_phone');
  const storeAddress = storeInfo?.address || t('default_store_address');
  const storeNote = storeInfo?.note || t('default_store_note');

  const isUSD = currency === 'USD';
  const rate = exchangeRate || 4000;
  const mainTotal = formatCurrency(sale.totalPrice);

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
    <html lang="${locale || 'en'}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${receiptNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          @media print {
            body {
              background: none !important;
              padding: 0 !important;
            }
            .receipt-container {
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            margin: 0;
            padding: 24px 12px;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
          }
          .receipt-container {
            max-width: 440px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            padding: 28px 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
            border: 1px solid #e5e7eb;
            position: relative;
          }
          .brand-accent {
            height: 6px;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
            border-radius: 999px;
            margin-bottom: 20px;
          }
          .header {
            text-align: center;
            padding-bottom: 16px;
            margin-bottom: 16px;
            border-bottom: 1px dashed #d1d5db;
          }
          .store-name {
            font-size: 22px;
            font-weight: 900;
            color: #1e3a8a;
            margin-bottom: 4px;
            letter-spacing: -0.3px;
          }
          .store-detail {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }
          .receipt-title-badge {
            display: inline-block;
            margin-top: 12px;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 12px;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background-color: #f9fafb;
            padding: 12px 14px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid #f3f4f6;
          }
          .meta-item-label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          .meta-item-val {
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            margin-top: 2px;
          }
          .status-paid {
            color: #15803d;
            font-weight: 800;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 8px 0;
            border-bottom: 2px solid #e5e7eb;
          }
          .items-table th.right { text-align: right; }
          .items-table td {
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: middle;
          }
          .item-name {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
          }
          .item-unit-price {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }
          .item-qty {
            font-size: 14px;
            font-weight: 700;
            color: #374151;
            text-align: right;
          }
          .item-total {
            font-size: 15px;
            font-weight: 800;
            color: #1e40af;
            text-align: right;
          }
          .summary-card {
            background-color: #eff6ff;
            border-radius: 14px;
            padding: 16px;
            border: 1px solid #dbeafe;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .summary-row.total {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1.5px solid #bfdbfe;
            font-size: 16px;
          }
          .summary-total-label {
            font-weight: 800;
            color: #1e3a8a;
          }
          .summary-total-val {
            font-size: 22px;
            font-weight: 900;
            color: #1d4ed8;
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
            font-size: 13px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .app-tagline {
            font-size: 11px;
            color: #9ca3af;
          }
          .barcode {
            margin-top: 14px;
            font-family: monospace;
            font-size: 14px;
            letter-spacing: 5px;
            color: #4b5563;
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
              <div class="meta-item-val">${formattedDate}</div>
            </div>
            <div>
              <div class="meta-item-label">${t('pay_method_label')}</div>
              <div class="meta-item-val">${sale.paymentMethod === 'khqr' ? t('pay_method_khqr') : t('pay_method_cash')}</div>
            </div>
            <div style="text-align: right;">
              <div class="meta-item-label">Payment Status</div>
              <div class="meta-item-val status-paid">✓ ${t('invoice_status_paid')}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>${t('invoice_item')}</th>
                <th class="right">${t('invoice_qty')}</th>
                <th class="right">${t('invoice_total')}</th>
              </tr>
            </thead>
            <tbody>
              ${(Array.isArray(sale.items) && sale.items.length > 0
                ? sale.items
                : [{ productName: sale.productName, quantity: sale.quantity, unitPrice: sale.unitPrice, totalPrice: sale.totalPrice }]
              ).map((item) => `
                <tr>
                  <td>
                    <div class="item-name">${escapeHtml(item.productName)}</div>
                    <div class="item-unit-price">@ ${formatCurrency(item.unitPrice)}</div>
                  </td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-total">${formatCurrency(item.totalPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-card">
            <div class="summary-row">
              <span style="color: #4b5563;">${t('invoice_subtotal')}</span>
              <span style="font-weight: 700; color: #1f2937;">${mainTotal}</span>
            </div>
            <div class="summary-row">
              <span style="color: #4b5563;">Tax / VAT (0%)</span>
              <span style="font-weight: 700; color: #15803d;">FREE</span>
            </div>
            <div class="summary-row total">
              <span class="summary-total-label">${t('invoice_total')}</span>
              <span class="summary-total-val">${mainTotal}</span>
            </div>
            ${altTotal ? `<div class="alt-curr-note">(${t('invoice_dual_curr')}: ${altTotal})</div>` : ''}
          </div>

          <div class="footer">
            <div class="thank-you">${escapeHtml(storeNote)}</div>
            <div class="app-tagline">Generated by GoStock POS Inventory App</div>
            <div class="barcode">||||| | |||| ||| ||||</div>
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
 * Download PDF file to device or share PDF document
 */
export async function downloadPDFAsync(options) {
  const { sale, t } = options;
  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);
  const html = generateReceiptHTML(options);

  if (Platform.OS === 'web') {
    // For Web, trigger print-to-PDF / download window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      await Print.printAsync({ html });
    }
  } else {
    // For Mobile (iOS & Android): Generate PDF file with Print API and prompt Share/Save
    const { uri } = await Print.printToFileAsync({ html });
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${t('download_pdf_title') || 'Download PDF'} - ${receiptNo}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ html });
    }
  }
}

/**
 * Print receipt using Expo Print API or Web window.print()
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
      }, 250);
    } else {
      await Print.printAsync({ html });
    }
  } else {
    await Print.printAsync({ html });
  }
}

/**
 * Share invoice as PDF or formatted message
 */
export async function shareInvoiceAsync(options) {
  const { sale, t } = options;
  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);

  try {
    const html = generateReceiptHTML(options);
    if (Platform.OS !== 'web') {
      const { uri } = await Print.printToFileAsync({ html });
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${t('share_invoice')} ${receiptNo}`,
          UTI: 'com.adobe.pdf',
        });
        return;
      }
    }
    // Fallback to text share
    const textMsg = generateReceiptText(options);
    await Share.share({
      message: textMsg,
      title: `${t('invoice_title')} ${receiptNo}`,
    });
  } catch (error) {
    console.warn('Error sharing invoice:', error);
    const textMsg = generateReceiptText(options);
    await Share.share({
      message: textMsg,
      title: `${t('invoice_title')} ${receiptNo}`,
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
