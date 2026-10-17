import { useMemo, useState } from "react"
import { ArrowRight, Minus, Plus, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { calculatePlans, PACKS, type Plan } from "@/lib/calculator"

type Item = { id: number; name: string; price: string; quantity: number }
const format = (value: number) => new Intl.NumberFormat("zh-TW").format(value)
const parseNumber = (value: string) => {
  if (!/^\d+$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number <= 1_000_000 ? number : null
}

function VpMark({ small = false }: { small?: boolean }) {
  return <img src={`${import.meta.env.BASE_URL}valorant-points.png`} alt={small ? "" : "VP 圖示"} className={small ? "h-5 w-5 flex-none object-contain" : "h-9 w-9 flex-none object-contain"} />
}

function ResultCard({ title, plan, needed, minimum, highlight = false }: {
  title: string; plan: Plan; needed: number; minimum: number; highlight?: boolean
}) {
  const extra = plan.price - minimum
  return <Card role="region" className={`!gap-0 !py-0 mt-4 rounded-xl border p-4 sm:p-5 ${highlight ? "border-[#ea7479] bg-[linear-gradient(135deg,#1e424d,#15343f)]" : "border-[#45626d] bg-[#123542]"}`} aria-label={title}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="mb-1 text-xs font-bold text-[#f68f94]">{highlight ? "推薦先看" : "比較方案"}</p><h3 className="text-[19px] font-extrabold">{title}</h3></div>
      {extra > 0 && <span className="whitespace-nowrap rounded-md bg-[#3b4c51] px-2 py-1.5 text-xs font-bold text-[#f6c7c8]">多花 NT$ {format(extra)}</span>}
    </div>
    <div className="my-3 flex items-baseline gap-2 font-display text-[42px] leading-tight font-bold text-white sm:text-[49px]"><span className="text-xl text-[#acc8cf]">NT$</span>{format(plan.price)}</div>
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[#44616b] pb-4 text-[13px] text-[#a9c2c9]"><span>儲入 <strong className="font-bold text-[#dff2f2]">{format(plan.vp)} VP</strong></span><span>購買後剩 <strong className="font-bold text-[#dff2f2]">{format(plan.vp - needed)} VP</strong></span><span>每 NT$ 1 元約 <strong className="font-bold text-[#dff2f2]">{(plan.vp / plan.price).toFixed(2)} VP</strong></span></div>
    <div className="divide-y divide-[#35535f]" aria-label="需要購買的儲值面額">
      {PACKS.map((pack, index) => plan.counts[index] > 0 && <div className="flex items-center justify-between gap-2.5 py-3 font-display text-[15px] font-semibold text-[#e4f0f1]" key={pack.vp}>
        <span className="inline-flex items-center gap-2"><VpMark small />{format(pack.vp)} VP <span className="text-[#a8c2c8]">× {plan.counts[index]}</span></span>
        <span>NT$ {format(pack.price * plan.counts[index])}</span>
      </div>)}
    </div>
  </Card>
}

export function App() {
  const [currentVp, setCurrentVp] = useState("0")
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "", price: "", quantity: 1 }])
  const [nextId, setNextId] = useState(2)
  const [extraBudget, setExtraBudget] = useState("500")
  const current = parseNumber(currentVp)
  const extra = parseNumber(extraBudget)
  const entries = items.map(item => ({ ...item, parsedPrice: parseNumber(item.price) }))
  const hasInvalidPrice = entries.some(item => item.price !== "" && (item.parsedPrice === null || item.parsedPrice === 0))
  const target = entries.reduce((sum, item) => sum + (item.parsedPrice ?? 0) * item.quantity, 0)
  const needed = current === null ? 0 : Math.max(0, target - current)
  const valid = current !== null && !hasInvalidPrice && target <= 1_000_000
  const result = useMemo(() => valid && needed > 0 ? calculatePlans(needed, extra ?? 0) : null, [valid, needed, extra])
  const valueDifferent = result && result.bestValue.price !== result.cheapest.price

  function updateItem(id: number, patch: Partial<Item>) {
    setItems(previous => previous.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  function addItem() {
    setItems(previous => [...previous, { id: nextId, name: "", price: "", quantity: 1 }])
    setNextId(previous => previous + 1)
  }

  return <main className="min-h-screen bg-[#071b29] text-[#eaf3f5]">
    <div className="relative mx-auto max-w-[1300px] px-3.5 sm:px-5 lg:px-8">
      <header className="flex min-h-[66px] items-center border-b border-[#2b4752] sm:min-h-[72px]"><h1 className="flex items-center gap-2.5 text-lg font-extrabold"><VpMark />特務幣計算器</h1></header>

      <div className="grid items-start gap-5 pt-5 sm:pt-7 md:grid-cols-[minmax(0,1.07fr)_minmax(0,.93fr)]">
        <section className="min-w-0 rounded-2xl border border-[#3b5964] bg-[#102e3c] p-5 shadow-[0_16px_50px_#03121e30] sm:p-6 lg:p-[30px]" aria-labelledby="input-title">
          <div className="mb-7 flex items-start gap-3 lg:mb-8"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#f2757b] font-display text-[15px] font-bold text-[#ff8c91]">01</span><div><h2 className="text-xl font-extrabold lg:text-[22px]" id="input-title">填入你的購買計畫</h2><p className="mt-1 text-[13px] leading-relaxed text-[#a7bdc4]">加入多個商品，會一起計算最省的儲值方式。</p></div></div>
          <div className="mb-8"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor="current-vp">目前擁有的 VP</Label><div className="flex h-[54px] w-full items-center gap-2 rounded-[10px] border border-[#53717b] bg-[#173946] px-3.5 text-[#92d3d1] focus-within:border-[#91e2e0] focus-within:ring-[3px] focus-within:ring-[#91e2e02b] has-[input[aria-invalid=true]]:border-[#ff8f93]"><Wallet size={22} aria-hidden="true" /><Input className="!h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !px-0 !text-lg !font-semibold !text-white !shadow-none !outline-none placeholder:!font-normal placeholder:!text-[#83a1aa] focus-visible:!ring-0" id="current-vp" type="number" min="0" max="1000000" step="1" inputMode="numeric" value={currentVp} aria-invalid={current === null} onChange={event => setCurrentVp(event.target.value)} /><span className="font-display text-sm font-bold text-[#aac4ca]">VP</span></div>{current === null && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">請輸入 0 到 1,000,000 的整數。</p>}</div>
          <div className="mb-3 flex items-baseline justify-between gap-2"><h3 className="text-[17px] font-extrabold">想買的造型或組合包</h3><span className="text-sm text-[#9eb9c0]">{items.length} 項</span></div>
          <div className="grid gap-3">{items.map((item, index) => <Card className="!gap-0 !py-0 rounded-xl border border-[#3d5b67] !bg-[#123340] p-3.5 sm:p-4" key={item.id}>
            <div className="mb-3 flex min-h-6 items-center justify-between text-[13px] font-extrabold text-[#91d7d4]"><span>商品 {index + 1}</span>{items.length > 1 && <Button type="button" variant="ghost" size="icon" className="!h-9 !w-9 !text-[#a9c0c7] hover:!bg-[#ff90961e] hover:!text-[#ff9096]" aria-label={`移除商品 ${index + 1}`} onClick={() => setItems(previous => previous.filter(entry => entry.id !== item.id))}><Trash2 size={19} /></Button>}</div>
            <div className="grid grid-cols-[minmax(0,1fr)_116px] items-end gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(125px,1fr)_122px] lg:gap-3">
              <div className="col-span-full lg:col-span-1"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor={`name-${item.id}`}>名稱<span className="text-xs font-normal text-[#91aeb7]">選填</span></Label><Input className="!h-[54px] w-full !rounded-[10px] !border !border-[#53717b] !bg-[#173946] !px-3.5 !text-lg !font-semibold !text-white placeholder:!font-normal placeholder:!text-[#83a1aa] focus-visible:!border-[#91e2e0] focus-visible:!ring-[3px] focus-visible:!ring-[#91e2e02b]" id={`name-${item.id}`} type="text" placeholder="例如：造型組合包" value={item.name} onChange={event => updateItem(item.id, { name: event.target.value })} /></div>
              <div className="min-w-0"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor={`price-${item.id}`}>價格</Label><div className="flex h-[54px] w-full items-center gap-2 rounded-[10px] border border-[#53717b] bg-[#173946] px-3.5 text-[#92d3d1] focus-within:border-[#91e2e0] focus-within:ring-[3px] focus-within:ring-[#91e2e02b] has-[input[aria-invalid=true]]:border-[#ff8f93]"><Input className="!h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !px-0 !text-lg !font-semibold !text-white !shadow-none !outline-none placeholder:!font-normal placeholder:!text-[#83a1aa] focus-visible:!ring-0" id={`price-${item.id}`} type="number" min="1" max="1000000" step="1" inputMode="numeric" placeholder="輸入 VP" value={item.price} aria-invalid={item.price !== "" && (parseNumber(item.price) === null || item.price === "0")} onChange={event => updateItem(item.id, { price: event.target.value })} /><span className="font-display text-sm font-bold text-[#aac4ca]">VP</span></div></div>
              <div className="min-w-0"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]">數量</Label><div className="flex h-[54px] items-center justify-between rounded-[10px] border border-[#53717b] bg-[#173946] [&_button]:h-[50px] [&_button]:w-9 [&_button]:text-[#eaf5f5] [&_button:hover]:bg-[#2c5863] [&_output]:font-display [&_output]:text-lg [&_output]:font-bold"><Button type="button" variant="ghost" size="icon" aria-label={`商品 ${index + 1} 數量減一`} disabled={item.quantity <= 1} onClick={() => updateItem(item.id, { quantity: item.quantity - 1 })}><Minus size={18} /></Button><output aria-label={`數量 ${item.quantity}`}>{item.quantity}</output><Button type="button" variant="ghost" size="icon" aria-label={`商品 ${index + 1} 數量加一`} disabled={item.quantity >= 99} onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}><Plus size={18} /></Button></div></div>
            </div>
          </Card>)}</div>
          {hasInvalidPrice && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">商品價格請填入 1 到 1,000,000 的整數 VP。</p>}
          {target > 1_000_000 && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">購買總額最多可計算 1,000,000 VP。</p>}
          <Button type="button" variant="outline" className="mt-4 !h-[53px] w-full !rounded-[10px] !border !border-dashed !border-[#6b929a] !bg-[#123744] !text-[15px] !font-bold !text-[#a9e1df] hover:!bg-[#1b4853]" onClick={addItem}><Plus size={20} />加入另一件商品</Button>
        </section>

        <aside className="min-w-0 rounded-2xl border border-[#3b5964] bg-[#0b2836] p-5 shadow-[0_16px_50px_#03121e30] sm:p-6 lg:p-[30px]" aria-live="polite" aria-labelledby="summary-title">
          <div className="mb-7 flex items-start gap-3 lg:mb-8"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#f2757b] font-display text-[15px] font-bold text-[#ff8c91]">02</span><div><h2 className="text-xl font-extrabold lg:text-[22px]" id="summary-title">儲值建議</h2><p className="mt-1 text-[13px] leading-relaxed text-[#a7bdc4]">依目前台灣商店的面額計算。</p></div></div>
          {target === 0 ? <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-[#466672] p-8 text-center"><div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-[#1d4653]"><VpMark /></div><h3 className="mb-2 text-[19px] font-bold">先填入想買的商品價格</h3><p className="max-w-[270px] text-sm leading-relaxed text-[#a6bdc4]">輸入至少一件商品的 VP 價格，這裡就會顯示儲值建議。</p></div> : !valid ? <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-[#466672] p-8 text-center"><h3 className="mb-2 text-[19px] font-bold">請檢查輸入內容</h3><p className="max-w-[270px] text-sm leading-relaxed text-[#a6bdc4]">修正上方標示的數字後，就能看到儲值建議。</p></div> : <>
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-[#365964] bg-[#153a48] px-3 py-4 sm:px-5"><div className="flex flex-col gap-1.5"><span className="text-[13px] text-[#a8c0c6]">購買總額</span><strong className="whitespace-nowrap font-display text-[21px] font-bold sm:text-[26px]">{format(target)} <small className="text-xs sm:text-sm">VP</small></strong></div><ArrowRight size={20} aria-hidden="true" /><div className="flex flex-col items-end gap-1.5 text-right"><span className="text-[13px] text-[#a8c0c6]">還需要</span><strong className="whitespace-nowrap font-display text-[21px] font-bold text-[#8ee5e0] sm:text-[26px]">{format(needed)} <small className="text-xs sm:text-sm">VP</small></strong></div></div>
            {needed === 0 ? <div className="px-5 py-10 text-center"><div className="mx-auto mb-5 grid h-[75px] w-[75px] place-items-center rounded-full border-2 border-[#82ddd5] text-[39px] text-[#9bf0e7]">✓</div><h3 className="mb-2 text-[21px] font-bold">目前的 VP 已經足夠</h3><p className="text-[15px] leading-relaxed text-[#acc4ca]">買完後還會剩下 <strong className="text-[#e3f5f3]">{format((current ?? 0) - target)} VP</strong>，不需要額外儲值。</p></div> : result && <>
              <ResultCard title="花費最少" plan={result.cheapest} needed={needed} minimum={result.cheapest.price} highlight />
              <div className="mt-6 flex items-start justify-between gap-3"><div><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor="extra-budget">最划算方案的加價上限</Label><p className="max-w-[320px] text-xs leading-relaxed text-[#9fb8c0]">只比較比最低花費最多再加這筆金額的組合。</p></div><div className="flex h-11 w-[119px] flex-none items-center rounded-[10px] border border-[#53717b] bg-[#173946] px-2.5 text-[#adc8ce] focus-within:border-[#91e2e0] focus-within:ring-[3px] focus-within:ring-[#91e2e02b]"><span className="text-xs">NT$</span><Input className="!h-full min-w-0 !rounded-none !border-0 !bg-transparent !p-0 !text-right !font-display !text-[17px] !font-bold !text-white !shadow-none focus-visible:!ring-0" id="extra-budget" type="number" min="0" max="1000000" step="50" inputMode="numeric" value={extraBudget} aria-invalid={extra === null} onChange={event => setExtraBudget(event.target.value)} /></div></div>
              {extra === null && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">加價上限請輸入 0 到 1,000,000 的整數。</p>}
              {extra !== null && (valueDifferent ? <ResultCard title="每元 VP 最多" plan={result.bestValue} needed={needed} minimum={result.cheapest.price} /> : <div className="mt-4 rounded-[10px] border border-[#3d646c] bg-[#153b46] px-4 py-3.5 text-sm leading-relaxed text-[#b9d8da]">在這個加價上限內，最低花費也是每元 VP 最多的方案。</div>)}
            </>}
          </>}
        </aside>
      </div>
      <section className="py-10 sm:py-12" aria-labelledby="how-to-title">
        <h2 className="mb-4 text-xl font-extrabold" id="how-to-title">使用方式</h2>
        <ol className="grid gap-3 text-sm leading-7 text-[#c2d4d9] sm:grid-cols-3">
          <li className="rounded-xl border border-[#35525e] bg-[#0d2a38] p-4"><strong className="mb-1 block text-base text-white">1. 填入現有 VP</strong>輸入目前帳號裡的特務幣。</li>
          <li className="rounded-xl border border-[#35525e] bg-[#0d2a38] p-4"><strong className="mb-1 block text-base text-white">2. 加入想買的商品</strong>輸入造型或組合包價格；買多件可新增商品或調整數量。</li>
          <li className="rounded-xl border border-[#35525e] bg-[#0d2a38] p-4"><strong className="mb-1 block text-base text-white">3. 比較儲值方案</strong>先看最低花費，也可調整加價上限，比較每元能買到更多 VP 的組合。</li>
        </ol>
        <details className="mt-5 rounded-xl border border-[#35525e] bg-[#0d2a38] px-4 py-3 text-sm text-[#b5cbd1]">
          <summary className="cursor-pointer font-bold text-[#eaf3f5]">查看計算使用的台灣商店面額</summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">{PACKS.map(pack => <li key={pack.vp}>{format(pack.vp)} VP＝NT$ {format(pack.price)}</li>)}</ul>
          <p className="mt-3 text-xs leading-relaxed text-[#90afb8]">依你提供的商店資訊建立；實際價格請以遊戲內結帳畫面為準。</p>
        </details>
      </section>
      <footer className="border-t border-[#274653] py-6 text-xs leading-relaxed text-[#8caab4]">非 Riot Games 官方網站。此工具僅協助試算，未提供儲值或付款服務。</footer>
    </div>
  </main>
}

export default App
