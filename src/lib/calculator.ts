export const PACKS = [
  { vp: 460, price: 150, base: 460, bonus: 0 },
  { vp: 930, price: 300, base: 920, bonus: 10 },
  { vp: 1600, price: 500, base: 1533, bonus: 67 },
  { vp: 3300, price: 1000, base: 3067, bonus: 233 },
  { vp: 5050, price: 1490, base: 4569, bonus: 481 },
  { vp: 10600, price: 3000, base: 9200, bonus: 1400 },
] as const

export const LEFTOVER_GOALS = [
  { vp: 1000, label: "通行證升級" },
  { vp: 1275, label: "奢華武器造型" },
  { vp: 1750, label: "部分限定近戰造型" },
  { vp: 1775, label: "尊爵武器造型" },
  { vp: 2175, label: "限定武器造型" },
  { vp: 2475, label: "究極武器造型" },
  { vp: 2550, label: "部分近戰造型" },
  { vp: 3550, label: "部分近戰造型" },
  { vp: 4350, label: "部分近戰造型" },
  { vp: 4950, label: "部分究極近戰造型" },
  { vp: 5350, label: "部分究極近戰造型" },
  { vp: 5440, label: "部分限定近戰造型" },
  { vp: 5950, label: "部分究極近戰造型" },
] as const

export function affordableGoal(leftoverVp: number) {
  for (let index = LEFTOVER_GOALS.length - 1; index >= 0; index--) {
    if (LEFTOVER_GOALS[index].vp <= leftoverVp) return LEFTOVER_GOALS[index]
  }
  return null
}

export type Plan = { price: number; vp: number; counts: number[] }
export type Alternative = { plan: Plan; betterValue: boolean }
export type Calculation = { cheapest: Plan; alternatives: Alternative[] }

const COST_UNIT = 10
const MAX_EXTRA_COST = 200
const MAX_GOAL_EXTRA_COST = 500
const MAX_EXTRA_COST_PERCENT = 10
const MIN_RATE_GAIN_PERCENT = 5
const MAX_ALTERNATIVES = 3

export function calculatePlans(neededVp: number): Calculation | null {
  if (!Number.isSafeInteger(neededVp) || neededVp <= 0) return null

  let bestPackIndex = 0
  PACKS.forEach((pack, index) => {
    if (pack.vp * PACKS[bestPackIndex].price > PACKS[bestPackIndex].vp * pack.price) bestPackIndex = index
  })
  const bestPack = PACKS[bestPackIndex]
  const bestPackCount = Math.ceil(neededVp / bestPack.vp)
  const maxUnits = (bestPackCount * bestPack.price + MAX_GOAL_EXTRA_COST) / COST_UNIT
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

  const currentGoalVp = affordableGoal(bestVp[cheapestCost] - neededVp)?.vp ?? 0
  let goalCost = -1
  let goalGain = 0
  for (let cost = cheapestCost + 1; cost <= maxUnits; cost++) {
    if ((cost - cheapestCost) * COST_UNIT > MAX_GOAL_EXTRA_COST) break
    const gain = (affordableGoal(bestVp[cost] - neededVp)?.vp ?? 0) - currentGoalVp
    if (gain <= 0) continue
    if (goalCost < 0 || gain * (goalCost - cheapestCost) > goalGain * (cost - cheapestCost)) {
      goalCost = cost
      goalGain = gain
    }
  }

  let bestMarginalCost = -1
  let nextBetterRateCost = -1
  for (let cost = cheapestCost + 1; cost <= maxUnits; cost++) {
    if ((cost - cheapestCost) * COST_UNIT > MAX_EXTRA_COST) break
    if (bestVp[cost] <= bestVp[cheapestCost]) continue
    if (bestMarginalCost < 0 || (bestVp[cost] - bestVp[cheapestCost]) * (bestMarginalCost - cheapestCost) > (bestVp[bestMarginalCost] - bestVp[cheapestCost]) * (cost - cheapestCost)) {
      bestMarginalCost = cost
    }
    if (bestVp[cost] * cheapestCost > bestVp[cheapestCost] * cost) {
      nextBetterRateCost = cost
      break
    }
  }
  const preferredCost = goalCost >= 0 ? goalCost : nextBetterRateCost >= 0 ? nextBetterRateCost : bestMarginalCost
  if (preferredCost < 0) throw new Error("找不到其他儲值組合")

  // 同樣或更少的特務幣若能用更低的價格取得，就不列出該組合。
  const candidateCosts: number[] = []
  let highestVp = bestVp[cheapestCost]
  for (let cost = cheapestCost + 1; cost <= maxUnits; cost++) {
    if ((cost - cheapestCost) * COST_UNIT > MAX_GOAL_EXTRA_COST) break
    if (bestVp[cost] <= highestVp) continue
    candidateCosts.push(cost)
    highestVp = bestVp[cost]
  }

  // 先保留原本的首選，再選價格距離最遠的方案，避免列出幾個幾乎相同的金額。
  const selectedCosts = [preferredCost]
  while (selectedCosts.length < MAX_ALTERNATIVES) {
    let nextCost = -1
    let widestGap = -1
    for (const cost of candidateCosts) {
      if (selectedCosts.includes(cost)) continue
      const gap = Math.min(...selectedCosts.map(selected => Math.abs(cost - selected)))
      if (gap > widestGap || (gap === widestGap && cost < nextCost)) {
        nextCost = cost
        widestGap = gap
      }
    }
    if (nextCost < 0) break
    selectedCosts.push(nextCost)
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

  const cheapest = buildPlan(cheapestCost)
  const alternatives = selectedCosts.sort((a, b) => a - b).map(cost => {
    const plan = buildPlan(cost)
    const extra = plan.price - cheapest.price
    return {
      plan,
      betterValue: extra <= MAX_EXTRA_COST
        && plan.price * 100 <= cheapest.price * (100 + MAX_EXTRA_COST_PERCENT)
        && plan.vp * cheapest.price * 100 >= cheapest.vp * plan.price * (100 + MIN_RATE_GAIN_PERCENT),
    }
  })

  return { cheapest, alternatives }
}
