// まちのレシートの頁。緑の札で予算と1人あたりを数え上げ、分野ごとの1人あたりのレシートを刷り出す（receipt/receipt.tsx）。
// 年度を替えたら、その年度の分を風土記から読み（中継の /api/jurisdictions/:code?year=）、URL の ?year= も替える。
// レシートの末端まで頁が送られたら、他のまちを探す節を出す
import * as React from 'react'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { ReceiptMachine } from '../receipt/receipt'
import { Emblem } from '../components/parts'
import { Title } from '../components/title'
import { Footer, Intro } from '../components/intro'
import { TownSearch } from '../components/town-search'
import { FUDOKI_ORIGIN, pageTitle, reiwa, yearName, yearView, yearsOf, type Snapshot } from '../lib/fudoki'
import { cn } from '../lib/cn'
import type { Props } from './[code].server'

/** 読んだ年度のデータ。年度を替えたらその年度を読み、読めなければ前の年度のまま */
function useYear(first: Snapshot) {
  const [byYear, setByYear] = React.useState<Record<string, Snapshot>>({ [first.year]: first })
  const [year, setYear] = React.useState(first.year)
  const [code, setCode] = React.useState(first.code)
  if (code !== first.code) {
    // 頁を移らずに別のまちへ移った（他のまちを探す欄から）
    setCode(first.code)
    setByYear({ [first.year]: first })
    setYear(first.year)
  }
  /** 年度を替え終えたら、URL の ?year= と頁の題をその年度にする（読めなかったら前の年度のまま） */
  const show = (x: Snapshot) => {
    setYear(x.year)
    const url = new URL(location.href)
    url.searchParams.set('year', String(x.year))
    history.replaceState(history.state, '', url)
    document.title = pageTitle(x.name, x.year)
  }
  // 最後に押した年度だけを出す。続けて押すと、先に押した年度の応答が後から届くことがある
  const latest = React.useRef(0)
  const pick = (y: number) => {
    const n = ++latest.current
    const have = byYear[y]
    if (have) return show(have)
    void fetch(`/api/jurisdictions/${first.code}?year=${y}`)
      .then((r) => (r.ok ? (r.json() as Promise<Snapshot>) : null))
      .then((x) => {
        if (!x || x.code !== first.code) return
        setByYear((m) => ({ ...m, [x.year]: x }))
        if (n === latest.current) show(x)
      })
      .catch(() => {})
  }
  return { d: byYear[year] ?? first, setYear: pick }
}

/** 年度の切り替え。今年度・昨年度…で呼び、新しい年度から並べる。狭い画面は選んでいる年度だけを出して select で選ぶ */
function YearSwitch({ years, year, onPick }: { years: number[]; year: number; onPick: (y: number) => void }) {
  if (years.length < 2) return null
  const desc = [...years].sort((a, b) => b - a)
  return (
    <>
      <div className="hidden gap-1 rounded-full border border-brand-foreground p-1 sm:flex" role="group" aria-label="年度">
        {desc.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onPick(y)}
            aria-pressed={y === year}
            title={reiwa(y)}
            className={cn('rounded-full px-3 py-1 text-sm transition-colors duration-150 ease-out', y === year ? 'bg-brand-fill text-brand-fill-foreground' : 'hover:bg-brand-fill-hover hover:text-brand-fill-foreground')}
          >
            {yearName(y)}
          </button>
        ))}
      </div>
      <select aria-label="年度" value={year} onChange={(e) => onPick(Number(e.target.value))} className="rounded-full bg-brand-fill px-3 py-2 text-sm text-brand-fill-foreground sm:hidden">
        {desc.map((y) => (
          <option key={y} value={y}>
            {yearName(y)}
            {yearName(y) !== reiwa(y) ? `（${reiwa(y).replace(/年度$/, '')}）` : ''}
          </option>
        ))}
      </select>
    </>
  )
}

export default function TownPage({ d: first, town }: Props) {
  const { d, setYear } = useYear(first)
  const v = yearView(d)
  const years = yearsOf(d)
  // 風土記の本体での、そのまちのその年度の頁（最新の年度はまちの頁、それより前は予算・決算のタブ）
  const base = `${town.path}/${d.year}`
  const detailHref = d.year === years.at(-1) ? town.path : `${base}/${v.word === '決算' ? 'settlement' : 'budget'}`
  const [printed, setPrinted] = React.useState(false)
  return (
    <>
      <Intro />
      {/* 刷り出すレシートの場所を、はじめから画面1.5枚ぶん取っておき、刷り終える前に頁の末尾が見えないようにする */}
      <div className="min-h-[150svh]">
        <ReceiptMachine
          key={town.code}
          onPrinted={() => setPrinted(true)}
          path={`/${town.code}`}
          name={town.name}
          kind={town.kind}
          v={v}
          year={d.year}
          pop={d.pop || null}
          base={base}
          detailHref={detailHref}
          head={
            <div className="flex flex-wrap items-center gap-4 lg:items-start">
              <Emblem code={town.code} name={town.name} className="size-14 rounded-2xl border-0 p-2" />
              <div className="min-w-0 flex-1">
                <Title size="h1" as="h1">{town.name}</Title>
              </div>
              <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:shrink-0">
                <YearSwitch years={years} year={d.year} onPick={setYear} />
                <a href={`${FUDOKI_ORIGIN}${detailHref}`} className="inline-flex items-center gap-2 rounded-full border border-brand-fill bg-brand-fill px-4 py-2 text-sm font-medium text-brand-fill-foreground transition-colors hover:border-brand-fill-hover hover:bg-brand-fill-hover">
                  詳細
                  <ArrowRightIcon className="size-4" />
                </a>
              </div>
            </div>
          }
        />
        {/* 人口が無くレシートを刷れないまちは、札の下にそう出す */}
        {!d.pop ? <p className="mt-4 text-sm text-muted-foreground">このまちは人口を収録していないので、1人あたりのレシートを出せません。</p> : null}
        {printed || !d.pop ? (
          <section className="ob-rise mt-16" aria-labelledby="other-towns">
            <Title size="h2" id="other-towns" className="mb-4">他のまちの使い道を見る</Title>
            <TownSearch placeholder="他のまちを探す" />
          </section>
        ) : null}
      </div>
      <Footer />
    </>
  )
}
