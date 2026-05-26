// orders.js — pending order execution engine
// Called on every price tick to check if any limit or stop-loss orders have triggered.

import { getOpenOrders, fillOrder, adjustBalance, buyShares, sellShares, recordTx, awardXP, addNotification } from '../state/store.js'
import { getPrice } from '../api/prices.js'
import { FEE_RATE } from '../config.js'
import { toast } from '../components/toast.js'
import { pc } from './format.js'

export function processOrders() {
  const open = getOpenOrders()
  if (!open.length) return

  open.forEach(order => {
    const p = getPrice(order.symbol)
    if (!p.price) return

    let triggered = false

    if (order.side === 'buy' && order.type === 'limit') {
      // Buy limit: execute when price drops TO or BELOW the limit price
      triggered = p.price <= order.targetPrice
    } else if (order.side === 'sell' && order.type === 'limit') {
      // Sell limit: execute when price rises TO or ABOVE the limit price
      triggered = p.price >= order.targetPrice
    } else if (order.side === 'sell' && order.type === 'stop-loss') {
      // Stop-loss: execute when price drops TO or BELOW the stop price
      triggered = p.price <= order.targetPrice
    }

    if (!triggered) return

    const execPrice = p.price
    const subtotal  = order.qty * execPrice
    const fee       = Math.ceil(subtotal * FEE_RATE * 100) / 100

    if (order.side === 'buy') {
      const total = subtotal + fee
      adjustBalance(-total)
      buyShares(order.symbol, order.qty, execPrice)
      recordTx({ type: 'buy', symbol: order.symbol, qty: order.qty, price: execPrice, fee, total, orderType: order.type })
      awardXP(Math.max(1, Math.round(subtotal / 100)))
    } else {
      const proceeds = subtotal - fee
      adjustBalance(proceeds)
      sellShares(order.symbol, order.qty)
      recordTx({ type: 'sell', symbol: order.symbol, qty: order.qty, price: execPrice, fee, total: proceeds, orderType: order.type })
      awardXP(Math.max(1, Math.round(subtotal / 200)))
    }

    fillOrder(order.id)
    const msg = `${order.type === 'stop-loss' ? 'Stop-loss' : 'Limit order'} filled: ${order.side === 'buy' ? 'Bought' : 'Sold'} ${order.qty} ${order.symbol} @ ${pc(execPrice)}`
    toast(msg, 'success', 4500)
    addNotification({ type: 'order', message: msg })
  })
}
