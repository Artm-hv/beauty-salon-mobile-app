import type { AppointmentItem, ClientItem, OrderItem } from './mockData';

type CustomerReference = Pick<AppointmentItem, 'clientId' | 'clientName' | 'clientPhone'>;

export function clientMetrics(clients: ClientItem[], bookings: AppointmentItem[], orders: OrderItem[]): ClientItem[] {
  const digits = (value: string) => (value || '').replace(/\D/g, '');
  const placeholderPhones = new Set(['380670000000', '485000000000', '380000000000']);
  function customer(item: CustomerReference) {
    if (item.clientId) return item.clientId;
    const phone = digits(item.clientPhone);
    const matches = phone.length >= 7 && !placeholderPhones.has(phone)
      ? clients.filter(c => digits(c.phone) === phone)
      : clients.filter(c => c.name.trim().toLowerCase() === item.clientName.trim().toLowerCase());
    return matches.length === 1 ? matches[0].id : undefined;
  }

  const byId = new Map(bookings.map(b => [b.id, b]));
  const receipted = new Set<string>();
  const payments = new Map<string, number[]>();
  function addPayment(id: string | undefined, amount: number) {
    if (!id) return;
    const amounts = payments.get(id) ?? [];
    amounts.push(amount);
    payments.set(id, amounts);
  }
  for (const order of orders) {
    const key = order.bookingId || order.id.replace(/^ord-/, '');
    const booking = byId.get(key) ?? byId.get('b-' + key);
    if (booking) receipted.add(booking.id);
    if (order.status === 'COMPLETED') addPayment(customer(booking ?? order), order.totalAmount);
  }
  const completed = new Map<string, number>();
  const booked = new Set<string>();
  for (const booking of bookings) {
    const id = customer(booking);
    if (!id) continue;
    if (booking.status !== 'CANCELLED') booked.add(id);
    if (booking.status === 'COMPLETED' || booking.hasPayment) completed.set(id, (completed.get(id) ?? 0) + 1);
    // Older paid visits sometimes predate the creation of linked receipts.
    if (!receipted.has(booking.id) && booking.hasPayment) addPayment(id, booking.price);
  }
  return clients.map(client => {
    // Imported cards carry historical totals from before their first booking in the app.
    const amounts = payments.get(client.id) ?? [];
    const totalSpent = amounts.reduce((sum, value) => sum + value, client.totalSpent);
    const historicalChecks = client.averageCheck > 0 ? Math.round(client.totalSpent / client.averageCheck) : 0;
    const checks = historicalChecks + amounts.length;
    return { ...client, hasBooking: booked.has(client.id) || client.visitCount > 0,
      visitCount: client.visitCount + (completed.get(client.id) ?? 0), totalSpent,
      averageCheck: amounts.length && checks ? Math.round(totalSpent / checks) : client.averageCheck };
  });
}
