const tickersHandlers = new Map<string, TickerHandler[]>()

export type TickerHandler = (price: number) => void
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${process.env.VUE_APP_CRYPTOCOMPARE_API_KEY}`
)

const AGGREGATE_INDEX = '5'

socket.addEventListener('message', (e) => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  )

  if (type !== AGGREGATE_INDEX || !newPrice) {
    return
  }

  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach((fn) => fn(newPrice))
})

const sendToWebSocket = (message: string) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message)
    return
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(message)
    },
    { once: true }
  )
}

const subscribeToTickerOnWs = (ticker: string) => {
  const message = JSON.stringify({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~USD`],
  })

  sendToWebSocket(message)
}

const unsubscribeFromTickerOnWs = (ticker: string) => {
  const message = JSON.stringify({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`],
  })

  sendToWebSocket(message)
}

export const subscribeToTicker = (
  tickerName: string,
  cb: TickerHandler
): void => {
  const subscribers = tickersHandlers.get(tickerName) || ([] as TickerHandler[])
  tickersHandlers.set(tickerName, [...subscribers, cb])
  subscribeToTickerOnWs(tickerName)
}

export const unsubscribeFromTicker = (tickerName: string): void => {
  tickersHandlers.delete(tickerName)
  unsubscribeFromTickerOnWs(tickerName)
}
