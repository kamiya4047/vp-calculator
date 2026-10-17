export type ShareItem = { name: string; price: string; quantity: number }

export function parseVpNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number <= 1_000_000 ? number : null
}

export function readShareQuery(search: string): { currentVp: string; items: ShareItem[] } {
  const params = new URLSearchParams(search)
  const vp = parseVpNumber(params.get("vp") ?? "0")
  const items = params.getAll("item").flatMap(value => {
    const [rawPrice, rawQuantity, ...rawName] = value.split(",")
    const price = parseVpNumber(rawPrice.trim())
    const quantityText = rawQuantity?.trim() || "1"
    const quantity = Number(quantityText)
    if (price === null || price === 0 || !/^\d+$/.test(quantityText) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return []
    return [{ name: rawName.join(",").trim(), price: String(price), quantity }]
  })
  return { currentVp: String(vp ?? 0), items }
}

export function createShareUrl(baseUrl: string, currentVp: number, items: ShareItem[]): string {
  const url = new URL(baseUrl)
  const params = new URLSearchParams()
  params.set("vp", String(currentVp))
  for (const item of items) {
    const price = parseVpNumber(item.price)
    if (price === null || price === 0) continue
    const name = item.name.trim()
    const value = [String(price)]
    if (item.quantity !== 1 || name) value.push(String(item.quantity))
    if (name) value.push(name)
    params.append("item", value.join(","))
  }
  url.search = params.toString()
  url.hash = ""
  return url.toString()
}
