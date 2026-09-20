// lib/telegram.ts

interface OrderPayload {
  orderCode: number;
  customerName: string;
  phoneNumber: string;
  deliveryType: 'delivery' | 'pickup';
  address?: string | null;
  pickupTime?: string | null;
  distanceKm?: number | null;
  deliveryFee?: number;
  totalPrice: number;
  notes?: string | null;
  items: Array<{ title?: string; name?: string; quantity: number; price: number }>;
}

export async function sendTelegramOrderNotification(order: OrderPayload) {
  const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing in environment variables.');
    return;
  }

  // Format Items List
  const itemList = order.items
    .map((item) => `• <b>${item.quantity}x</b> ${item.title || item.name} (LKR ${item.price * item.quantity})`)
    .join('\n');

  // Format Delivery vs Pickup details
  const deliveryInfo =
    order.deliveryType === 'delivery'
      ? `🛵 <b>Type:</b> Home Delivery\n📍 <b>Address:</b> ${order.address || 'N/A'}\n📏 <b>Distance:</b> ${order.distanceKm ? order.distanceKm.toFixed(2) : 0} km`
      : `🏪 <b>Type:</b> Store Pickup\n🕒 <b>Pickup Time:</b> ${order.pickupTime || 'N/A'}`;

  // Build HTML formatted Telegram message
  const message = `
🚨 <b>NEW ORDER RECEIVED!</b> 🚨

🆔 <b>Order Code:</b> #${order.orderCode}
👤 <b>Customer:</b> ${order.customerName}
📞 <b>Phone:</b> <a href="tel:${order.phoneNumber}">${order.phoneNumber}</a>

${deliveryInfo}

🛒 <b>Items Ordered:</b>
${itemList}

💵 <b>Subtotal:</b> LKR ${order.totalPrice - (order.deliveryFee || 0)}
🚚 <b>Delivery Fee:</b> LKR ${order.deliveryFee || 0}
💰 <b>TOTAL CHARGED:</b> LKR ${order.totalPrice}

${order.notes ? `📝 <b>Notes:</b> ${order.notes}` : ''}
⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('Failed to send Telegram notification:', errData);
    }
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}