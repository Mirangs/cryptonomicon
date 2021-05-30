const tickersHandlers = new Map<string, TickerHandler[]>()

export type TickerHandler = (price: number) => void

export const loadTickers = async (
  tickerNames: string[]
): Promise<Record<string, number> | void> => {
  if (!tickerNames.length) {
    return
  }
  try {
    const params = new URLSearchParams()
    params.append('tsyms', 'USD')
    params.append('fsyms', [...tickerNames].join(','))
    params.append('api_key', process.env.VUE_APP_CRYPTOCOMPARE_API_KEY)

    const res = await fetch(
      `https://min-api.cryptocompare.com/data/pricemulti?${params.toString()}`
    )
    const rawData: Record<string, { USD: number }> = await res.json()
    const updatedPrices = Object.fromEntries(
      Object.entries(rawData).map(([key, value]) => [key, value.USD])
    )

    Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
      const handlers = tickersHandlers.get(currency) ?? []
      handlers.forEach((fn) => fn(newPrice))
    })
  } catch (err) {
    console.error(err)
    return {
      USD: 0,
    }
  }
}

export const subscribeToTicker = (
  tickerName: string,
  cb: TickerHandler
): void => {
  const subscribers = tickersHandlers.get(tickerName) || ([] as TickerHandler[])
  tickersHandlers.set(tickerName, [...subscribers, cb])
}

export const unsubscribeFromTicker = (tickerName: string): void => {
  tickersHandlers.delete(tickerName)
}
