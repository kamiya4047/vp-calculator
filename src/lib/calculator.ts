export const PACKS = [
  { vp: 460, price: 150, base: 460, bonus: 0 },
  { vp: 930, price: 300, base: 920, bonus: 10 },
  { vp: 1600, price: 500, base: 1533, bonus: 67 },
  { vp: 3300, price: 1000, base: 3067, bonus: 233 },
  { vp: 5050, price: 1500, base: 4569, bonus: 481 },
  { vp: 10600, price: 3000, base: 9200, bonus: 1400 },
] as const

export type Plan = { price: number; vp: number; counts: number[] }
export type Calculation = { cheapest: Plan; betterValue: Plan | null }

const COST_UNIT = 50

export function calculatePlans(neededVp: number): Calculation | null {
  if (!Number.isSafeInteger(neededVp) || neededVp <= 0) return null

  let bestPackIndex = 0
  PACKS.forEach((pack, index) => {
    if (pack.vp * PACKS[bestPackIndex].price > PACKS[bestPackIndex].vp * pack.price) bestPackIndex = index
  })
  const bestPack = PACKS[bestPackIndex]
  const bestPackCount = Math.ceil(neededVp / bestPack.vp)
  const maxUnits = bestPackCount * bestPack.price / COST_UNIT
  const bestVp = new Float64Array(maxUnits + 1)
  const previousPack = new Int8Array(maxUnits + 1).fill(-1)
  bestVp.fill(-1)
  bestVp[0] = 0

  for (let cost = 1; cost <= maxUnits; cost++) {
    PACKS.forEach((pack, index) => {
      const packUnits = pack.price / COST_UNIT
      if (cost < packUnits || bestVp[cost - packUnits] < 0) return
      const candidate = bestVp[cost - packUnits] + pack.vp
      if (candidate > bestVp[cost]) {
        bestVp[cost] = candidate
        previousPack[cost] = index
      }
    })
  }

  let cheapestCost = -1
  for (let cost = 1; cost <= maxUnits; cost++) {
    if (bestVp[cost] >= neededVp) {
      cheapestCost = cost
      break
    }
  }
  if (cheapestCost < 0) return null

  let betterCost = -1
  for (let cost = cheapestCost + 1; cost <= maxUnits; cost++) {
    if (bestVp[cost] < neededVp) continue
    if (bestVp[cost] * cheapestCost > bestVp[cheapestCost] * cost) {
      betterCost = cost
      break
    }
  }

  function buildPlan(cost: number): Plan {
    const counts = PACKS.map(() => 0)
    let remaining = cost
    while (remaining > 0) {
      const index = previousPack[remaining]
      if (index < 0) throw new Error("找不到儲值組合")
      counts[index]++
      remaining -= PACKS[index].price / COST_UNIT
    }
    return { price: cost * COST_UNIT, vp: bestVp[cost], counts }
  }

  return {
    cheapest: buildPlan(cheapestCost),
    betterValue: betterCost < 0 ? null : buildPlan(betterCost),
  }
}
