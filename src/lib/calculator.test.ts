import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { calculatePlans, PACKS } from "./calculator"

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

  it("小額商品仍有另一種買法，且不會跳到 10,600 特務幣面額", () => {
    const result = calculatePlans(3000)
    assert.equal(result?.cheapest.price, 1000)
    assert.deepEqual(result?.alternative, { price: 1150, vp: 3760, counts: [1, 0, 0, 1, 0, 0] })
    assert.equal(result?.betterValue, null)
  })

  it("加價 560 元即使單價提升明顯也不列為推薦", () => {
    const result = calculatePlans(8000)
    assert.equal(result?.cheapest.price, 2440)
    assert.equal(result?.betterValue, null)
  })

  it("加價 210 元超過上限時淡化其他買法", () => {
    const result = calculatePlans(9000)
    assert.equal(result?.cheapest.price, 2790)
    assert.deepEqual(result?.alternative, { price: 2980, vp: 10100, counts: [0, 0, 0, 0, 2, 0] })
    assert.equal(result?.betterValue, null)
  })

  it("9500 VP 只需多花 60 元時顯示 10600 VP 面額", () => {
    const result = calculatePlans(9500)
    assert.equal(result?.cheapest.price, 2940)
    assert.equal(result?.cheapest.vp, 9740)
    assert.deepEqual(result?.betterValue, { price: 3000, vp: 10600, counts: [0, 0, 0, 0, 0, 1] })
    assert.deepEqual(result?.alternative, result?.betterValue)
  })

  it("加價過高時仍提供較接近的其他買法", () => {
    const result = calculatePlans(11000)
    assert.equal(result?.betterValue, null)
    assert.equal(result?.alternative.price, 3300)
  })

  it("已是最高單價時仍提供其他買法，但不推薦加價", () => {
    const result = calculatePlans(10600)
    assert.equal(result?.betterValue, null)
    assert.deepEqual(result?.alternative, { price: 3150, vp: 11060, counts: [1, 0, 0, 0, 0, 1] })
  })

  it("大額目標可混合多個面額", () => {
    const result = calculatePlans(11000)
    assert.equal(result?.cheapest.price, 3150)
    assert.equal(result?.cheapest.vp, 11060)
    assert.equal(result?.cheapest.counts.reduce((vp, count, index) => vp + count * PACKS[index].vp, 0), 11060)
  })
})
