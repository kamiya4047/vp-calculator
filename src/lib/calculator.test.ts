import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { affordableGoal, calculatePlans, PACKS } from "./calculator"

describe("儲值組合", () => {
  it("5,050 特務幣面額為 NT$1,490", () => {
    assert.deepEqual(calculatePlans(5050)?.cheapest, { price: 1490, vp: 5050, counts: [0, 0, 0, 0, 1, 0] })
  })

  it("選出足夠 VP 的最低花費，並正確計算組合", () => {
    const result = calculatePlans(5500)
    assert.equal(result?.cheapest.price, 1640)
    assert.equal(result?.cheapest.vp, 5510)
    assert.deepEqual(result?.cheapest.counts, [1, 0, 0, 0, 1, 0])
  })

  it("同樣花費時選擇 VP 較多的組合", () => {
    const result = calculatePlans(3200)
    assert.deepEqual(result?.cheapest, { price: 1000, vp: 3300, counts: [0, 0, 0, 1, 0, 0] })
  })

  it("3,000 特務幣商品的其他買法留下足夠購買尊爵武器的餘額", () => {
    const result = calculatePlans(3000)
    assert.equal(result?.cheapest.price, 1000)
    assert.deepEqual(result?.alternatives.map(({ plan }) => plan.price), [1100, 1300, 1490])
    assert.deepEqual(result?.alternatives[2].plan, { price: 1490, vp: 5050, counts: [0, 0, 0, 0, 1, 0] })
    assert.equal(affordableGoal(result!.alternatives[2].plan.vp - 3000)?.vp, 1775)
    assert.equal(result?.alternatives[2].betterValue, false)
  })

  it("有更省的通行證餘額方案時仍將其列入其他買法", () => {
    const result = calculatePlans(5500)
    const plan = result?.alternatives.find(({ plan }) => plan.price === 1990)?.plan
    assert.ok(plan)
    assert.equal(affordableGoal(plan.vp - 5500)?.vp, 1000)
  })

  it("加價 560 元即使單價提升明顯也不列為推薦", () => {
    const result = calculatePlans(8000)
    assert.equal(result?.cheapest.price, 2440)
    assert.ok(result?.alternatives.every(({ betterValue }) => !betterValue))
  })

  it("加價 210 元超過上限時淡化其他買法", () => {
    const result = calculatePlans(9000)
    assert.equal(result?.cheapest.price, 2790)
    const option = result?.alternatives.find(({ plan }) => plan.price === 3000)
    assert.deepEqual(option?.plan, { price: 3000, vp: 10600, counts: [0, 0, 0, 0, 0, 1] })
    assert.equal(affordableGoal(option!.plan.vp - 9000)?.vp, 1275)
    assert.equal(option?.betterValue, false)
  })

  it("9500 VP 只需多花 60 元時顯示 10600 VP 面額", () => {
    const result = calculatePlans(9500)
    assert.equal(result?.cheapest.price, 2940)
    assert.equal(result?.cheapest.vp, 9740)
    assert.deepEqual(result?.alternatives[0], { plan: { price: 3000, vp: 10600, counts: [0, 0, 0, 0, 0, 1] }, betterValue: true })
  })

  it("加價過高時仍提供較接近的其他買法", () => {
    const result = calculatePlans(11000)
    assert.equal(result?.alternatives.length, 3)
    assert.ok(result?.alternatives.every(({ betterValue }) => !betterValue))
    assert.ok(result?.alternatives.some(({ plan }) => plan.price === 3500))
  })

  it("已是最高單價時仍提供其他買法，但不推薦加價", () => {
    const result = calculatePlans(10600)
    assert.ok(result?.alternatives.every(({ betterValue }) => !betterValue))
    assert.deepEqual(result?.alternatives[2].plan, { price: 3450, vp: 11990, counts: [1, 1, 0, 0, 0, 1] })
  })

  it("其他買法的價格依序增加，且每種都比前一種得到更多特務幣", () => {
    for (const needed of [3000, 5500, 9500, 10600, 11000]) {
      const result = calculatePlans(needed)!
      let previous = result.cheapest
      for (const { plan } of result.alternatives) {
        assert.ok(plan.price > previous.price)
        assert.ok(plan.vp > previous.vp)
        assert.ok(plan.price - result.cheapest.price <= 500)
        previous = plan
      }
    }
  })

  it("大額目標可混合多個面額", () => {
    const result = calculatePlans(11000)
    assert.equal(result?.cheapest.price, 3150)
    assert.equal(result?.cheapest.vp, 11060)
    assert.equal(result?.cheapest.counts.reduce((vp, count, index) => vp + count * PACKS[index].vp, 0), 11060)
  })
})
