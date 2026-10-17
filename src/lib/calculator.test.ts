import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { calculatePlans, PACKS } from "./calculator"

describe("儲值組合", () => {
  it("選出足夠 VP 的最低花費，並正確計算組合", () => {
    const result = calculatePlans(5500, 500)
    assert.equal(result?.cheapest.price, 1650)
    assert.equal(result?.cheapest.vp, 5510)
    assert.deepEqual(result?.cheapest.counts, [1, 0, 0, 0, 1, 0])
  })

  it("同樣花費時選擇 VP 較多的組合", () => {
    const result = calculatePlans(3200, 0)
    assert.deepEqual(result?.cheapest, { price: 1000, vp: 3300, counts: [0, 0, 0, 1, 0, 0] })
  })

  it("單價方案受加價上限約束", () => {
    const result = calculatePlans(3300, 500)
    assert.equal(result?.cheapest.price, 1000)
    assert.equal(result?.bestValue.price, 1500)
    assert.equal(result?.bestValue.vp, 5050)
    assert.equal(calculatePlans(3300, 0)?.bestValue.price, 1000)
  })

  it("大額目標可混合多個面額", () => {
    const result = calculatePlans(11000, 500)
    assert.equal(result?.cheapest.price, 3150)
    assert.equal(result?.cheapest.vp, 11060)
    assert.equal(result?.cheapest.counts.reduce((vp, count, index) => vp + count * PACKS[index].vp, 0), 11060)
  })
})
