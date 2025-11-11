import React, {useMemo, useRef, useState} from 'react'
import * as htmlToImage from 'html-to-image'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend,
         RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

type Factor = { key: string; label: string; hint: string }
type Profile = { id: string; name: string; color: string; scores: Record<string, number> }

const DEFAULT_FACTORS: Factor[] = [
  { key: 'safeguarding', label: 'Safeguarding quality', hint: 'Clarity, training, evidence, LADO/DSL pathways.' },
  { key: 'attendance', label: 'Attendance lift', hint: 'Measured improvement without coercion; week-by-week proof.' },
  { key: 'ease', label: 'Ease of use', hint: 'Friction for staff/learners; camera‑optional norms embedded.' },
  { key: 'trust', label: 'Commissioner trust', hint: 'LA commissioning readiness; auditability; references.' },
  { key: 'value', label: 'Value for price', hint: 'Tiered pricing + elastic timetables; ROI clarity.' },
  { key: 'content', label: 'Content fireworks', hint: 'Shiny libraries. We keep this intentionally lower.' },
  { key: 'compliance', label: 'Compliance posture', hint: 'KCSIE/Children’s Code/DfE digital standards alignment.' },
]

const DEFAULT_PROFILES: Profile[] = [
  { id: 'ours', name: 'Our hyflex model', color: '#111827', scores: { safeguarding: 9, attendance: 8, ease: 8, trust: 9, value: 7, content: 3, compliance: 9 } },
  { id: 'content', name: 'Content platform', color: '#8B5CF6', scores: { safeguarding: 4, attendance: 5, ease: 7, trust: 4, value: 6, content: 9, compliance: 3 } },
  { id: 'tutor', name: 'Tutor aggregator', color: '#10B981', scores: { safeguarding: 5, attendance: 6, ease: 6, trust: 5, value: 8, content: 4, compliance: 5 } },
]

export default function App() {
  const [factors, setFactors] = useState<Factor[]>(DEFAULT_FACTORS)
  const [profiles, setProfiles] = useState<Profile[]>(DEFAULT_PROFILES)
  const [mode, setMode] = useState<'line'|'radar'>('line')
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [jsonText, setJsonText] = useState('')

  const chartData = useMemo(() => {
    return factors.map(f => {
      const row: any = { factor: f.label }
      profiles.forEach(p => row[p.id] = p.scores[f.key] ?? 0)
      return row
    })
  }, [factors, profiles])

  const reset = () => {
    setFactors(DEFAULT_FACTORS)
    setProfiles(DEFAULT_PROFILES)
  }

  const addProfile = () => {
    const n = profiles.length + 1
    const scores: Record<string, number> = {}
    factors.forEach(f => scores[f.key] = 5)
    setProfiles([...profiles, { id: 'p' + n, name: 'Profile ' + n, color: randomColor(), scores }])
  }

  const randomColor = () => `hsl(${Math.floor(Math.random()*360)} 70% 45%)`

  const exportCSV = () => {
    const headers = ['Factor', ...profiles.map(p => p.name)].join(',')
    const rows = factors.map(f => [f.label, ...profiles.map(p => p.scores[f.key])].join(','))
    const csv = [headers, ...rows].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'value_curve.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPNG = async () => {
    if (!chartRef.current) return
    const dataUrl = await htmlToImage.toPng(chartRef.current, { pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = dataUrl; a.download = 'value_curve.png'; a.click()
  }

  const saveJSON = () => {
    const payload = { factors, profiles }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'value_curve_config.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const loadJSON = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (parsed.factors) setFactors(parsed.factors)
      if (parsed.profiles) setProfiles(parsed.profiles)
    } catch { alert('Invalid JSON') }
  }

  return (
    <div className="container">
      <div className="row" style={{marginBottom:12}}>
        <h1>Value‑Curve Canvas</h1>
        <div className="row" style={{gap:8}}>
          <button className="btn secondary" onClick={reset}>Reset</button>
          <button className="btn secondary" onClick={addProfile}>Add profile</button>
          <button className="btn secondary" onClick={exportCSV}>Export CSV</button>
          <button className="btn secondary" onClick={saveJSON}>Save JSON</button>
          <button className="btn" onClick={downloadPNG}>Download PNG</button>
        </div>
      </div>

      <div className="row" style={{gap:8, marginBottom:10}}>
        <span className="badge">Mode:</span>
        <button className={"pill"} onClick={() => setMode('line')} style={{background: mode==='line'?'#111827':'#fff', color: mode==='line'?'#fff':'#111'}}>Line</button>
        <button className={"pill"} onClick={() => setMode('radar')} style={{background: mode==='radar'?'#111827':'#fff', color: mode==='radar'?'#fff':'#111'}}>Radar</button>
      </div>

      <div className="card" ref={chartRef}>
        <ResponsiveContainer width="100%" height={380}>
          {mode==='line' ? (
            <LineChart data={chartData} margin={{left:12,right:24,top:16,bottom:8}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="factor" interval={0} angle={-15} textAnchor="end" height={70}/>
              <YAxis domain={[0,10]} ticks={[0,2,4,6,8,10]}/>
              <Legend/>
              {profiles.map(p => <Line key={p.id} type="monotone" dataKey={p.id} name={p.name} stroke={p.color} dot />)}
            </LineChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius={140} data={chartData}>
              <PolarGrid/>
              <PolarAngleAxis dataKey="factor" />
              <PolarRadiusAxis angle={30} domain={[0,10]}/>
              {profiles.map(p => <Radar key={p.id} name={p.name} dataKey={p.id} stroke={p.color} fill={p.color} fillOpacity={0.2}/>)}
              <Legend/>
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-3" style={{marginTop:12}}>
        {profiles.map((p, idx) => (
          <div className="card" key={p.id}>
            <div className="row" style={{marginBottom:8}}>
              <div><span className="legend-dot" style={{background:p.color}}></span> <input className="pill" value={p.name} onChange={e => {
                const next = [...profiles]; next[idx] = { ...p, name: e.target.value }; setProfiles(next);
              }}/></div>
              <input type="color" value={p.color} onChange={e => {
                const next = [...profiles]; next[idx] = { ...p, color: e.target.value }; setProfiles(next);
              }}/>
            </div>
            {factors.map(f => (
              <div className="row" key={f.key}>
                <div style={{flex:1}}>
                  <div className="small">{f.label}</div>
                  <div className="small">{f.hint}</div>
                </div>
                <input className="range" type="range" min={0} max={10} step={1} value={p.scores[f.key] ?? 0}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const next = [...profiles];
                    next[idx] = { ...p, scores: { ...p.scores, [f.key]: val } };
                    setProfiles(next);
                  }}
                />
                <div style={{width:22, textAlign:'right'}}>{p.scores[f.key] ?? 0}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:12}}>
        <p className="small">Paste a saved JSON config here to reload a session, or edit factors/profiles offline.</p>
        <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder='{"factors": [...], "profiles": [...]}'></textarea>
        <div className="row"><button className="btn secondary" onClick={loadJSON}>Load JSON</button><span className="small">© The Novacene · Building Schools in the Cloud</span></div>
      </div>
    </div>
  )
}
