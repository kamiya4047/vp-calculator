import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Link2, Minus, Plus, RotateCcw, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { affordableGoal, calculatePlans, PACKS, type Plan } from "@/lib/calculator"
import { createShareUrl, parseVpNumber, readShareQuery, type ShareItem } from "@/lib/share"

type Item = ShareItem & { id: number }
const format = (value: number) => new Intl.NumberFormat("zh-TW").format(value)

function VpMark({ small = false, className = "" }: { small?: boolean; className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}valorant-points.png`} alt={small ? "" : "特務幣圖示"} className={`${small ? "h-5 w-5" : "h-9 w-9"} flex-none object-contain ${className}`} />
}

function EditableItemName({ name, fallback, onChange }: { name: string; fallback: string; onChange: (name: string) => void }) {
  const element = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (element.current && document.activeElement !== element.current && element.current.textContent !== name) element.current.textContent = name
  }, [name])

  return <span
    ref={element}
    contentEditable
    role="textbox"
    aria-label={`${fallback}名稱（選填）`}
    aria-multiline="false"
    data-placeholder={fallback}
    className="block min-h-10 min-w-0 flex-1 cursor-text rounded-md p-1 text-[15px] leading-8 font-bold text-[#91d7d4] hover:bg-[#ffffff0a] focus:bg-[#173946] focus:outline-2 focus:outline-[#88d9dd] empty:before:text-[#91d7d4] empty:before:content-[attr(data-placeholder)]"
    onInput={event => {
      const value = event.currentTarget.textContent ?? ""
      if (!value) event.currentTarget.replaceChildren()
      onChange(value)
    }}
    onBlur={event => {
      const value = (event.currentTarget.textContent ?? "").trim()
      event.currentTarget.textContent = value
      if (value !== name) onChange(value)
    }}
    onKeyDown={event => {
      if (event.key === "Enter") {
        event.preventDefault()
        event.currentTarget.blur()
      }
    }}
    onPaste={event => {
      event.preventDefault()
      const text = event.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ")
      const selection = window.getSelection()
      if (!selection?.rangeCount) return
      const range = selection.getRangeAt(0)
      if (!event.currentTarget.contains(range.commonAncestorContainer)) return
      range.deleteContents()
      const node = document.createTextNode(text)
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      const value = event.currentTarget.textContent ?? ""
      if (!value) event.currentTarget.replaceChildren()
      onChange(value)
    }}
  />
}

function ResultCard({ title, plan, needed, minimum, highlight = false, subdued = false, compact = false }: {
  title: string; plan: Plan; needed: number; minimum: number; highlight?: boolean; subdued?: boolean; compact?: boolean
}) {
  const extra = plan.price - minimum
  const goal = affordableGoal(plan.vp - needed)
  return <Card role="region" className={`${compact ? "mt-3 !p-3.5 sm:!p-4" : "mt-4 !p-4 sm:!p-5"} !gap-0 !rounded-xl border !ring-0 ${highlight ? "border-[#ea7479] bg-[linear-gradient(135deg,#1e424d,#15343f)]" : "border-[#45626d] bg-[#123542]"} ${subdued ? "opacity-70" : ""}`} aria-label={title}>
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-[19px] font-extrabold">{title}</h3>
      {extra > 0 && <span className="whitespace-nowrap rounded-md bg-[#3b4c51] px-2 py-1.5 text-xs font-bold text-[#f6c7c8]">多花 NT$ {format(extra)}</span>}
    </div>
    <div className={`flex items-baseline gap-2 font-display leading-tight font-bold text-white ${compact ? "my-2 text-[32px] sm:text-[36px]" : "my-3 text-[42px] sm:text-[49px]"}`}><span className="text-xl text-[#acc8cf]">NT$</span>{format(plan.price)}</div>
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[#44616b] pb-4 text-[13px] text-[#a9c2c9]"><span>可得 <strong className="font-bold text-[#dff2f2]">{format(plan.vp)} 特務幣</strong></span><span>買完剩 <strong className="font-bold text-[#dff2f2]">{format(plan.vp - needed)} 特務幣</strong></span><span>每元可得 <strong className="font-bold text-[#dff2f2]">{(plan.vp / plan.price).toFixed(3)} 特務幣</strong></span></div>
    {goal && <p className="mt-3 rounded-md bg-[#244854] px-3 py-2 text-sm leading-relaxed text-[#d9eeec]">餘額達到 {goal.label}的常見價位（約 {format(goal.vp)} 特務幣）</p>}
    <div className="divide-y divide-[#35535f]" aria-label="需要購買的儲值面額">
      {PACKS.map((pack, index) => plan.counts[index] > 0 && <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 py-3 font-display text-[15px] font-semibold text-[#e4f0f1]" key={pack.vp}>
        <span className="inline-flex items-center gap-2"><VpMark small className="-translate-y-0.5" />{format(pack.vp)} 特務幣 <span className="text-[#a8c2c8]">× {plan.counts[index]}</span></span>
        <span>NT$ {format(pack.price * plan.counts[index])}</span>
      </div>)}
    </div>
  </Card>
}

export function App() {
  const [shared] = useState(() => readShareQuery(window.location.search))
  const [currentVp, setCurrentVp] = useState(shared.currentVp)
  const [items, setItems] = useState<Item[]>(shared.items.length ? shared.items.map((item, index) => ({ ...item, id: index + 1 })) : [{ id: 1, name: "", price: "", quantity: 1 }])
  const [nextId, setNextId] = useState(Math.max(2, shared.items.length + 1))
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [copyError, setCopyError] = useState(false)
  const current = parseVpNumber(currentVp)
  const entries = items.map(item => ({ ...item, parsedPrice: parseVpNumber(item.price) }))
  const hasInvalidPrice = entries.some(item => item.price !== "" && (item.parsedPrice === null || item.parsedPrice === 0))
  const target = entries.reduce((sum, item) => sum + (item.parsedPrice ?? 0) * item.quantity, 0)
  const needed = current === null ? 0 : Math.max(0, target - current)
  const valid = current !== null && !hasInvalidPrice && target <= 1_000_000
  const result = useMemo(() => valid && needed > 0 ? calculatePlans(needed) : null, [valid, needed])
  const shareUrl = valid && target > 0 && current !== null ? createShareUrl(new URL(import.meta.env.BASE_URL, window.location.origin).toString(), current, items) : null

  function updateItem(id: number, patch: Partial<Item>) {
    setItems(previous => previous.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  function addItem() {
    setItems(previous => [...previous, { id: nextId, name: "", price: "", quantity: 1 }])
    setNextId(previous => previous + 1)
  }
  async function copyShareLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(shareUrl)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }
  function resetCalculator() {
    setCurrentVp("0")
    setItems([{ id: 1, name: "", price: "", quantity: 1 }])
    setNextId(2)
    setCopiedUrl(null)
    setCopyError(false)
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.hash)
  }

  return <main className="min-h-screen bg-[#071b29] text-[#eaf3f5]">
    <div className="relative mx-auto max-w-[1300px] px-3.5 sm:px-5 lg:px-8">
      <header className="flex min-h-[66px] items-center border-b border-[#2b4752] sm:min-h-[72px]"><h1 className="flex items-center gap-2.5 text-lg font-extrabold"><VpMark className="-translate-y-0.5" />特務幣計算器</h1></header>

      <div className="grid items-start gap-5 pt-5 sm:pt-7 md:grid-cols-[minmax(0,1.07fr)_minmax(0,.93fr)]">
        <section className="min-w-0 rounded-2xl border border-[#3b5964] bg-[#102e3c] p-5 shadow-[0_16px_50px_#03121e30] sm:p-6 lg:p-[30px]" aria-labelledby="input-title">
          <div className="mb-7 flex items-center gap-3 lg:mb-8"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#f2757b] font-display text-[15px] font-bold text-[#ff8c91]">01</span><h2 className="text-xl font-extrabold leading-tight lg:text-[22px]" id="input-title">填入特務幣和商品價格</h2></div>
          <div className="mb-8"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor="current-vp">目前擁有的特務幣</Label><div className="flex h-[54px] w-full items-center gap-2 rounded-[10px] border border-[#53717b] bg-[#173946] px-3.5 text-[#92d3d1] focus-within:border-[#91e2e0] focus-within:ring-[3px] focus-within:ring-[#91e2e02b] has-[input[aria-invalid=true]]:border-[#ff8f93]"><Wallet size={22} aria-hidden="true" /><Input className="!h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !px-0 !text-lg !font-semibold !text-white !shadow-none !outline-none placeholder:!font-normal placeholder:!text-[#83a1aa] focus-visible:!ring-0" id="current-vp" type="number" min="0" max="1000000" step="1" inputMode="numeric" value={currentVp} aria-invalid={current === null} onChange={event => setCurrentVp(event.target.value)} /><span className="font-display text-sm font-bold text-[#aac4ca]">特務幣</span></div>{current === null && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">請輸入 0 到 1,000,000 的整數。</p>}</div>
          <div className="mb-3 flex items-baseline justify-between gap-2"><h3 className="text-[17px] font-extrabold">想買的造型或組合包</h3><span className="text-sm text-[#9eb9c0]">{items.length} 項</span></div>
          <div className="grid gap-3">{items.map((item, index) => <Card className="!gap-0 !rounded-xl border border-[#3d5b67] !bg-[#123340] !p-3.5 !ring-0 sm:!p-4" key={item.id}>
            <div className="mb-3 flex min-h-10 items-center justify-between gap-2"><EditableItemName name={item.name} fallback={`商品 ${index + 1}`} onChange={name => updateItem(item.id, { name })} />{items.length > 1 && <Button type="button" variant="ghost" size="icon" className="!h-10 !w-10 !flex-none !text-[#a9c0c7] hover:!bg-[#ff90961e] hover:!text-[#ff9096]" aria-label={`移除商品 ${index + 1}`} onClick={() => setItems(previous => previous.filter(entry => entry.id !== item.id))}><Trash2 size={19} /></Button>}</div>
            <div className="grid grid-cols-1 items-start gap-2.5 px-1 min-[375px]:grid-cols-[minmax(0,1fr)_116px] lg:grid-cols-[minmax(0,1fr)_122px] lg:gap-3">
              <div className="min-w-0"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]" htmlFor={`price-${item.id}`}>價格</Label><div className="flex h-[54px] w-full items-center gap-2 rounded-[10px] border border-[#53717b] bg-[#173946] px-3.5 text-[#92d3d1] focus-within:border-[#91e2e0] focus-within:ring-[3px] focus-within:ring-[#91e2e02b] has-[input[aria-invalid=true]]:border-[#ff8f93]"><Input className="!h-full min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !px-0 !text-lg !font-semibold !text-white !shadow-none !outline-none placeholder:!font-normal placeholder:!text-[#83a1aa] focus-visible:!ring-0" id={`price-${item.id}`} type="number" min="1" max="1000000" step="1" inputMode="numeric" placeholder="輸入" value={item.price} aria-invalid={item.price !== "" && (parseVpNumber(item.price) === null || item.price === "0")} onChange={event => updateItem(item.id, { price: event.target.value })} /><span className="shrink-0 text-sm font-bold text-[#aac4ca]">特務幣</span></div></div>
              <div className="w-[116px] min-w-0 min-[375px]:w-auto"><Label className="mb-2 text-[15px] font-bold text-[#e9f3f4]">數量</Label><div className="flex h-[54px] items-center justify-between rounded-[10px] border border-[#53717b] bg-[#173946] [&_button]:h-[50px] [&_button]:w-9 [&_button]:text-[#eaf5f5] [&_button:hover]:bg-[#2c5863] [&_output]:font-display [&_output]:text-lg [&_output]:font-bold"><Button type="button" variant="ghost" size="icon" aria-label={`商品 ${index + 1} 數量減一`} disabled={item.quantity <= 1} onClick={() => updateItem(item.id, { quantity: item.quantity - 1 })}><Minus size={18} /></Button><output aria-label={`數量 ${item.quantity}`}>{item.quantity}</output><Button type="button" variant="ghost" size="icon" aria-label={`商品 ${index + 1} 數量加一`} disabled={item.quantity >= 99} onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}><Plus size={18} /></Button></div></div>
            </div>
          </Card>)}</div>
          {hasInvalidPrice && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">商品價格請填入 1 到 1,000,000 的整數特務幣。</p>}
          {target > 1_000_000 && <p className="mt-2 text-[13px] leading-relaxed text-[#ffacb0]">購買總額最多可計算 1,000,000 特務幣。</p>}
          <Button type="button" variant="outline" className="mt-4 !h-[53px] w-full !rounded-[10px] !border !border-dashed !border-[#6b929a] !bg-[#123744] !text-[15px] !font-bold !text-[#a9e1df] hover:!bg-[#1b4853]" onClick={addItem}><Plus className="-translate-y-0.5" size={20} />加入另一件商品</Button>
          <Button type="button" variant="outline" className="mt-3 !h-[53px] w-full !rounded-[10px] !border-[#6b929a] !bg-[#19424d] !text-[15px] !font-bold !text-[#eaf3f5] hover:!bg-[#255460]" disabled={!shareUrl} onClick={copyShareLink}><Link2 className="-translate-y-0.5" size={19} /><span aria-live="polite">{copiedUrl && copiedUrl === shareUrl ? "已複製分享連結" : "複製分享連結"}</span></Button>
          <Button type="button" variant="ghost" className="mt-2 !h-12 w-full !rounded-[10px] !text-[15px] !font-bold !text-[#aac4ca] hover:!bg-[#1b4853] hover:!text-[#eaf3f5]" onClick={resetCalculator}><RotateCcw className="-translate-y-0.5" size={18} />重設</Button>
          {copyError && shareUrl && <div className="mt-3"><Label className="mb-1.5 text-sm text-[#b9d3d8]" htmlFor="share-url">無法自動複製，請手動複製連結</Label><Input id="share-url" value={shareUrl} readOnly onFocus={event => event.currentTarget.select()} className="!h-11 !border-[#53717b] !bg-[#173946] !text-sm !text-white" /></div>}
        </section>

        <aside className="min-w-0 rounded-2xl border border-[#3b5964] bg-[#0b2836] p-5 shadow-[0_16px_50px_#03121e30] sm:p-6 lg:p-[30px]" aria-live="polite" aria-labelledby="summary-title">
          <div className="mb-7 flex items-center gap-3 lg:mb-8"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[#f2757b] font-display text-[15px] font-bold text-[#ff8c91]">02</span><h2 className="text-xl font-extrabold leading-tight lg:text-[22px]" id="summary-title">儲值結果</h2></div>
          {target === 0 ? <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-[#466672] p-8 text-center"><div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-[#1d4653]"><VpMark /></div><h3 className="mb-2 text-[19px] font-bold">請先輸入商品價格</h3></div> : !valid ? <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-dashed border-[#466672] p-8 text-center"><h3 className="mb-2 text-[19px] font-bold">請修正上方的數字</h3></div> : <>
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-[#365964] bg-[#153a48] px-3 py-4 sm:px-5"><div className="flex min-w-0 flex-col gap-1.5"><span className="text-[13px] text-[#a8c0c6]">購買總額</span><strong className="font-display text-[21px] leading-tight font-bold sm:text-[26px]">{format(target)} <small className="block text-xs sm:text-sm">特務幣</small></strong></div><ArrowRight size={20} aria-hidden="true" /><div className="flex min-w-0 flex-col items-end gap-1.5 text-right"><span className="text-[13px] text-[#a8c0c6]">還需要</span><strong className="font-display text-[21px] leading-tight font-bold text-[#8ee5e0] sm:text-[26px]">{format(needed)} <small className="block text-xs sm:text-sm">特務幣</small></strong></div></div>
            {needed === 0 ? <div className="px-5 py-10 text-center"><div className="mx-auto mb-5 grid h-[75px] w-[75px] place-items-center rounded-full border-2 border-[#82ddd5] text-[39px] text-[#9bf0e7]">✓</div><h3 className="mb-2 text-[21px] font-bold">現有特務幣足夠</h3><p className="text-[15px] leading-relaxed text-[#acc4ca]">買完剩 <strong className="text-[#e3f5f3]">{format((current ?? 0) - target)} 特務幣</strong>。</p></div> : result && <>
              <ResultCard title="花費最少" plan={result.cheapest} needed={needed} minimum={result.cheapest.price} highlight />
              <div className="mt-6 flex items-baseline justify-between gap-2"><h3 className="text-[18px] font-extrabold">其他買法</h3><span className="text-sm text-[#9eb9c0]">{result.alternatives.length} 種</span></div>
              {result.alternatives.map(({ plan, betterValue }, index) => <ResultCard key={plan.price} title={`買法 ${index + 1}`} plan={plan} needed={needed} minimum={result.cheapest.price} subdued={!betterValue} compact />)}
            </>}
          </>}
        </aside>
      </div>
      <section className="py-10 sm:py-12" aria-labelledby="how-to-title">
        <h2 className="mb-4 text-xl font-extrabold" id="how-to-title">使用方式</h2>
        <ol className="list-decimal space-y-2 pl-6 text-sm leading-7 text-[#c2d4d9]">
          <li>輸入目前持有的特務幣。</li>
          <li>填入想買的造型或組合包價格。買多件時，新增商品或調整數量。</li>
          <li>先看花費最少的組合。其他買法會列出不同加價幅度的組合，也會考慮餘額能否用於通行證或常見造型；加價較多或單價差異不大時，會以較淡的樣式顯示。</li>
          <li>點「複製分享連結」，就能把目前填好的內容傳給別人。</li>
        </ol>
        <details className="mt-5 rounded-xl border border-[#35525e] bg-[#0d2a38] px-4 py-3 text-sm text-[#b5cbd1]">
          <summary className="cursor-pointer font-bold text-[#eaf3f5]">台灣商店儲值面額</summary>
          <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">{PACKS.map(pack => <li key={pack.vp}>{format(pack.vp)} 特務幣＝NT$ {format(pack.price)}</li>)}</ul>
          <p className="mt-3 text-xs leading-relaxed text-[#90afb8]">實際價格請以遊戲內結帳畫面為準。</p>
        </details>
        <details className="mt-3 rounded-xl border border-[#35525e] bg-[#0d2a38] px-4 py-3 text-sm text-[#b5cbd1]">
          <summary className="cursor-pointer font-bold text-[#eaf3f5]">常見造型與通行證價位</summary>
          <ul className="mt-3 space-y-1.5 leading-relaxed">
            <li>通行證升級：約 1,000 特務幣</li>
            <li>武器造型：奢華 1,275、尊爵 1,775、限定 2,175、究極 2,475 特務幣</li>
            <li>近戰造型：奢華 2,550；尊爵 4,350；限定 1,750／2,550／3,550／4,350／5,440；究極 2,550／3,550／4,950／5,350／5,950 特務幣</li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#90afb8]">這些是試算參考價位，實際價格請以遊戲內顯示為準。</p>
        </details>
      </section>
      <footer className="border-t border-[#274653] py-6 text-xs leading-relaxed text-[#a7bec5]">
        <p>本網站僅供試算，無法儲值或付款。</p>
        <p className="mt-2">特務幣計算器依 Riot Games 的 <a className="underline underline-offset-2 hover:text-white" href="https://www.riotgames.com/en/legal" target="_blank" rel="noopener noreferrer">《Legal Jibber Jabber》政策</a>製作，使用 Riot Games 擁有的素材。Riot Games 未贊助或背書本網站。</p>
        <p className="mt-2" lang="en">VP Calculator was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.</p>
      </footer>
    </div>
  </main>
}

export default App
