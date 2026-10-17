import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createShareUrl, readShareQuery } from "./share"

describe("分享連結", () => {
  it("從網址還原目前 VP、多個商品、數量及名稱", () => {
    assert.deepEqual(readShareQuery("?vp=500&item=1775&item=2175,2,幻象,紅色"), {
      currentVp: "500",
      items: [
        { name: "", price: "1775", quantity: 1 },
        { name: "幻象,紅色", price: "2175", quantity: 2 },
      ],
    })
  })

  it("產生的分享連結可以完整還原，且不保留舊網址參數", () => {
    const url = createShareUrl("https://example.com/vp-calculator/?v=6", 930, [
      { name: "", price: "1775", quantity: 1 },
      { name: "幻象,紅色", price: "2175", quantity: 2 },
    ])
    assert.equal(new URL(url).searchParams.has("v"), false)
    assert.deepEqual(readShareQuery(new URL(url).search), {
      currentVp: "930",
      items: [
        { name: "", price: "1775", quantity: 1 },
        { name: "幻象,紅色", price: "2175", quantity: 2 },
      ],
    })
  })

  it("忽略無效商品與數量", () => {
    assert.deepEqual(readShareQuery("?vp=-1&item=abc&item=2000,0&item=3000,1"), {
      currentVp: "0",
      items: [{ name: "", price: "3000", quantity: 1 }],
    })
  })
})
