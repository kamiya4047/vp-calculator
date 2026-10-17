import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { calculatePlans, PACKS } from "./calculator"

describe("儲值組合", () => {
  it("選出足夠 VP 的最低花費，並正確計算組合", () => {
    const result = calculatePlans(5500)
    assert.equal(result?.cheapest.price, 1650)
    assert.equal(result?.cheapest.vp, 5510)
    assert.deepEqual(result?.cheapest.counts, [1, 0, 0, 0, 1, 0])
  })

  it("同樣花費時選擇 VP 較多的組合", () => {
    const result = calculatePlans(3200)
    assert.deepEqual(result?.cheapest, { price: 1000, vp: 3300, counts: [0, 0, 0, 1, 0, 0] })
  })

  it("小額商品的單價差距不明顯時只顯示最低花費", () => {
    const result = calculatePlans(3000)
    assert.equal(result?.cheapest.price, 1000)
    assert.equal(result?.betterValue, null)
  })

  it("加價 550 元即使單價提升明顯也不顯示", () => {
    const result = calculatePlans(8000)
    assert.equal(result?.cheapest.price, 2450)
    assert.equal(result?.betterValue, null)
  })

  it("加價 200 元且單價提升明顯時顯示第二種組合", () => {
    const result = calculatePlans(9000)
    assert.equal(result?.cheapest.price, 2800)
    assert.deepEqual(result?.betterValue, { price: 3000, vp: 10600, counts: [0, 0, 0, 0, 0, 1] })
  })

  it("9500 VP 只需多花 50 元時顯示 10600 VP 面額", () => {
    const result = calculatePlans(9500)
    assert.equal(result?.cheapest.price, 2950)
    assert.equal(result?.cheapest.vp, 9740)
    assert.deepEqual(result?.betterValue, { price: 3000, vp: 10600, counts: [0, 0, 0, 0, 0, 1] })
  })

  it("加價過高時只顯示最低花費", () => {
    assert.equal(calculatePlans(11000)?.betterValue, null)
  })

  it("已是最高單價時不推薦加價", () => {
    assert.equal(calculatePlans(10600)?.betterValue, null)
  })

  it("大額目標可混合多個面額", () => {
    const result = calculatePlans(11000)
    assert.equal(result?.cheapest.price, 3150)
    assert.equal(result?.cheapest.vp, 11060)
    assert.equal(result?.cheapest.counts.reduce((vp, count, index) => vp + count * PACKS[index].vp, 0), 11060)
  })
})
