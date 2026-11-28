import type { Screen } from './KioskStage';

export const walkthroughs: { label: string; start: Screen }[] = [
  { label: 'Welcome and services', start: 'welcome' },
  { label: 'Search and gift cards', start: 'search' },
  { label: 'Bill inquiry', start: 'bill_detail' },
  { label: 'Checkout and receipts', start: 'payment' },
  { label: 'Receipt tracking', start: 'track' },
  { label: 'Payment declined', start: 'declined' },
  { label: 'Payment under review', start: 'recovery' },
  { label: 'Refund recovery', start: 'refund' },
  { label: 'Price changed', start: 'price_changed' },
  { label: 'Already-paid bill', start: 'no_bill' },
  { label: 'Leave a pending payment', start: 'leave_pending' },
  { label: 'Operator and maintenance layouts', start: 'operator_login' },
];

// These are visual transitions between the supplied layouts. No device or order state is involved.
export const nextLayout: Partial<Record<Screen, Screen>> = {
  card: 'pending',
  cash: 'pending',
  qr: 'pending',
  pending: 'success',
  cancel_wait: 'cancelled',
  print_receipt: 'success',
};

export const layoutOnly: ReadonlySet<string> = new Set<Screen>([
  'bill_result', 'review_bill', 'status', 'pending', 'success', 'receipt', 'print_receipt',
  'operator_login', 'operator', 'cancel_wait', 'cancelled', 'refund', 'recovery', 'cash_issue', 'printer_issue',
]);

const noPayment = 'No payment has been started.';
export const offlineCopy: Partial<Record<Screen, Record<string, string>>> = {
  payment: {
    'Choose a method. Your order stays the same.': 'Choose a method to see its layout. Payments are unavailable.',
    'You’ll see confirmation here when payment is received. Do not make a second payment while one is pending.': noPayment,
    'Tap or insert at the payment': 'View the card terminal',
    'terminal.': 'layout.',
    'Insert accepted notes at the cash': 'View the cash payment',
    'slot.': 'layout.',
    'Scan with a supported payment': 'View the QR payment',
    'app.': 'layout.',
  },
  card: {
    'Pay at the card terminal': 'Card terminal preview',
    'Follow the instructions on the terminal below this screen.': 'A connected terminal is required to start a payment.',
    'Tap, insert or swipe your card': 'Card payments are unavailable',
    'Keep your card until the terminal asks you to remove it.': noPayment,
    'Waiting for terminal': 'Terminal disconnected',
    'Cancel this attempt': 'Payment methods',
  },
  cash: {
    'Insert your cash': 'Cash payment preview',
    'Use the cash slot below the screen.': 'Cash intake is unavailable.',
    'Before you insert money': 'Cash acceptor unavailable',
    'No change is available. Insert the exact total': 'A connected cash acceptor is required.',
    'shown.': '',
    'Still to insert': 'Example total',
    'AED 5, 10, 20, 50 and 100 notes.': 'Denominations depend on the installed device.',
    'Insert AED 50 + AED 5 for this order.': noPayment,
    'Need help with inserted cash?': 'Need help?',
  },
  qr: {
    'Scan to pay': 'QR payment preview',
    'Open a supported payment app and scan the payment request.': 'This layout shows a QR icon. No payment code was generated.',
    'Request expires in 02:00': noPayment,
    'Cancel this attempt': 'Payment methods',
  },
  transfer_check: {
    'Verify your identity to continue': 'Identity verification',
    'Money transfer needs a few additional checks.': 'This step requires a connected transfer service.',
    'Have your identity document ready': 'Identity verification is unavailable',
    'Follow the approved verification process, then add your': 'You can view this step in the design.',
    'recipient and review a fresh transfer quote before payment.': 'No identity details or payment are collected here.',
  },
  transfer: {
    'Get transfer quote': 'View verification step',
  },
  track_verify: {
    'Enter the verification code sent through the selected recovery method.': 'Verifying a receipt requires a connected transaction service.',
    'Check your registered contact': 'Receipt verification is unavailable',
    'Enter the code to securely view this transaction.': 'No verification code was sent.',
    'Verify and view status': 'View status',
  },
  invalid: {
    'We couldn’t find that account.': 'Enter at least four characters for the account or reference.',
  },
};
