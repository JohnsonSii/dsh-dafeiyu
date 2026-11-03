window.__ModuleLoader__.load({ id: 'dsh-dafeiyu', factory: (require) => {
  const module = { exports: {} }
  const exports = module.exports
  const React = require('react')
  const { useEffect, useRef, useState } = React
  const CONFIG_ENDPOINT = '/plugins/dsh-dafeiyu/config'
  const EVENTS_ENDPOINT = '/plugins/dsh-dafeiyu/events'
  const MANIFEST_ENDPOINT = '/plugins/dsh-dafeiyu/manifest'
  const FRAME_ENDPOINT = '/plugins/dsh-dafeiyu/frame'
  const BALANCE_ENDPOINT = '/plugins/dsh-dafeiyu/balance'

  const SETTINGS_STYLE_ID = 'dsh-dafeiyu-settings-style'
  // Mirrors the native settings sheet: 760px column, hairline rows inside a
  // settings card, 13px labels over 12px hints, and controls built from the
  // same theme tokens the rest of DSH uses.
  const SETTINGS_CSS = `
.dshdfy-section{display:flex;flex-direction:column;width:100%;max-width:760px;color:var(--dsw-alias-label-primary)}
.dshdfy-head{display:flex;flex-direction:column;gap:6px;padding-bottom:10px}
.dshdfy-title{margin:0;font-size:18px;line-height:26px;font-weight:600}
.dshdfy-intro{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}
.dshdfy-rows{display:flex;flex-direction:column}
.dshdfy-group{margin:22px 0 2px;font-size:13px;line-height:20px;font-weight:500;color:var(--dsw-alias-label-tertiary)}
.dshdfy-rows>.dshdfy-group:first-child{margin-top:0}
.dshdfy-row{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.dshdfy-row:last-child{border-bottom:none}
.dshdfy-row:has(+.dshdfy-group){border-bottom:none}
.dshdfy-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding-right:48px}
.dshdfy-label{font-size:14px;font-weight:400;line-height:22px}
.dshdfy-hint{font-size:12px;font-weight:400;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dshdfy-control{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:12px}
.dshdfy-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;corner-shape:round;background:var(--dsw-alias-border-l3,#d5d8dd);cursor:pointer}
.dshdfy-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
.dshdfy-switch:disabled{cursor:default;opacity:.5}
.dshdfy-thumb{display:block;width:16px;height:16px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-switch-thumb,#ffffff);transition:transform 120ms ease}
.dshdfy-switch[aria-checked=true] .dshdfy-thumb{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground,#ffffff)}
.dshdfy-select{appearance:none;-webkit-appearance:none;height:36px;padding:0 34px 0 14px;border:none;border-radius:var(--dsw-radius-md);background-color:var(--dsw-alias-bg-module-platform,#eef0f3);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23777d86' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}
.dshdfy-select:disabled{opacity:.5;cursor:default}
.dshdfy-checks{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px 16px;max-width:360px}
.dshdfy-check{display:inline-flex;align-items:center;gap:6px;font-size:14px;line-height:22px;white-space:nowrap;cursor:pointer}
.dshdfy-check input{flex:0 0 auto;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:inherit}
.dshdfy-check:has(input:disabled){cursor:default;opacity:.5}
.dshdfy-slider{appearance:none;-webkit-appearance:none;width:180px;height:4px;border-radius:999px;background:var(--dsw-alias-border-l3,#d5d8dd);outline:none;cursor:pointer}
.dshdfy-slider::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:16px;height:16px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-brand-primary,#111);box-shadow:0 0 0 .5px rgba(0,0,0,.12);cursor:pointer}
.dshdfy-slider:disabled{opacity:.5;cursor:default}
.dshdfy-value{min-width:44px;text-align:right;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.dshdfy-button{height:36px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform,#eef0f3);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}
.dshdfy-button:disabled{opacity:.5;cursor:default}
.dshdfy-note{margin:0;padding:8px 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dshdfy-note[data-error=true]{color:var(--dsw-alias-state-error-primary)}
.dshdfy-body{display:flex;flex-direction:column;gap:8px;padding:0 0 12px}
.dshdfy-table{width:100%;border-collapse:collapse;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.dshdfy-table th,.dshdfy-table td{padding:6px 0;text-align:right;font-weight:400}
.dshdfy-table th:first-child,.dshdfy-table td:first-child{text-align:left}
.dshdfy-table thead th{color:var(--dsw-alias-label-tertiary);font-weight:400}
.dshdfy-homebtn{display:inline-flex;align-items:center;gap:var(--dsh-sidebar-label-gap,8px);flex:0 0 auto;min-width:36px;max-width:46%;height:42px;margin:0;padding:0 calc(var(--dsh-sidebar-row-padding,12px) - var(--dsh-sidebar-paint-inset,0px));box-sizing:border-box;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer;overflow:hidden}
@media (hover:hover){.dshdfy-homebtn:hover{background-color:var(--dsw-alias-interactive-bg-hover)}}
.dshdfy-homebtn:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.dshdfy-homebtn-label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
`
  const BUBBLE_STATE_OPTIONS = [
    ['IDLE', '空闲'],
    ['THINKING', '思考中'],
    ['WORKING', '工作中'],
    ['WAITING', '等待确认'],
    ['SUCCESS', '完成'],
    ['ERROR', '错误'],
  ]
  const SOUND_STATE_OPTIONS = [
    ['SUCCESS', '对话完成'],
    ['ERROR', '工具出错'],
    ['APPROVAL', '等待审批'],
  ]

  function useSettingsStyle() {
    useEffect(() => {
      if (typeof document === 'undefined') return
      // Overwrite instead of skipping: a hot-swapped bundle keeps the previous
      // page's <style> element, and class names it no longer defines would then
      // render unstyled controls.
      const existing = document.getElementById(SETTINGS_STYLE_ID)
      if (existing) {
        existing.textContent = SETTINGS_CSS
        return
      }
      const element = document.createElement('style')
      element.id = SETTINGS_STYLE_ID
      element.textContent = SETTINGS_CSS
      document.head.append(element)
    }, [])
  }

  function Row({ label, hint, children }) {
    return React.createElement('div', { className: 'dshdfy-row' },
      React.createElement('div', { className: 'dshdfy-text' },
        React.createElement('span', { className: 'dshdfy-label' }, label),
        hint ? React.createElement('span', { className: 'dshdfy-hint' }, hint) : null,
      ),
      React.createElement('div', { className: 'dshdfy-control' }, children),
    )
  }

  // Styles are inline so the capsule keeps the native look even when the
  // injected stylesheet has not been refreshed yet.
  const SWITCH_TRACK = {
    boxSizing: 'border-box', position: 'relative', flex: '0 0 auto',
    width: 36, height: 20, padding: 2, border: 0, borderRadius: 999,
    // DSH applies a global superellipse corner shape; the native switch opts out.
    cornerShape: 'round',
    transition: 'background 120ms ease',
  }
  const SWITCH_THUMB = {
    display: 'block', width: 16, height: 16, borderRadius: '50%',
    cornerShape: 'round',
    transition: 'transform 120ms ease',
  }

  function Toggle({ checked, disabled, onChange, ariaLabel }) {
    const on = checked === true
    return React.createElement('button', {
      type: 'button', role: 'switch', className: 'dshdfy-switch',
      'aria-checked': on, 'aria-label': ariaLabel, disabled,
      style: {
        ...SWITCH_TRACK,
        background: on
          ? 'var(--dsw-alias-brand-primary, #1f2329)'
          : 'var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12))',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      },
      onClick: () => onChange(!on),
    }, React.createElement('span', {
      className: 'dshdfy-thumb',
      style: {
        ...SWITCH_THUMB,
        background: on
          ? 'var(--dsw-alias-label-primary-foreground, #ffffff)'
          : 'var(--dsw-alias-switch-thumb, #ffffff)',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
      },
    }))
  }

  function Choice({ value, options, disabled, onChange, ariaLabel }) {
    return React.createElement('select', {
      className: 'dshdfy-select',
      style: {
        appearance: 'none', WebkitAppearance: 'none', height: 36,
        padding: '0 34px 0 14px', border: 'none', borderRadius: 'var(--dsw-radius-md, 8px)',
        backgroundColor: 'var(--dsw-alias-bg-module-platform, #eef0f3)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23777d86' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 14,
        lineHeight: '22px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      },
      value, disabled, 'aria-label': ariaLabel,
      onChange: (event) => onChange(event.target.value),
    }, ...options.map(([option, label]) =>
      React.createElement('option', { key: option, value: option }, label)))
  }

  function ChipGroup({ value, options, disabled, onChange }) {
    const selected = Array.isArray(value) ? value : []
    const toggle = (state, checked) => {
      const next = new Set(selected)
      if (checked) next.add(state)
      else next.delete(state)
      onChange([...next])
    }
    return React.createElement('div', { className: 'dshdfy-checks' },
      ...options.map(([state, label]) =>
        React.createElement('label', { key: state, className: 'dshdfy-check' },
          React.createElement('input', {
            type: 'checkbox', checked: selected.includes(state), disabled,
            onChange: (event) => toggle(state, event.target.checked),
          }),
          label,
        ),
      ),
    )
  }

  function BalanceCard({ enabled, source }) {
    const [snapshot, setSnapshot] = useState(null)
    const [busy, setBusy] = useState(false)
    const sequence = useRef(0)
    const request = async (force = false) => {
      const current = ++sequence.current
      setBusy(true)
      try {
        const response = await fetch(BALANCE_ENDPOINT, { method: force ? 'POST' : 'GET', cache: 'no-store' })
        if (!response.ok) throw new Error('balance request failed')
        const next = await response.json()
        if (current === sequence.current) setSnapshot(next)
      } catch {
        if (current === sequence.current) setSnapshot((previous) => ({ ...previous, status: 'error', error: '余额查询暂时不可用，请稍后刷新。' }))
      } finally {
        if (current === sequence.current) setBusy(false)
      }
    }
    useEffect(() => {
      setSnapshot(null)
      if (!enabled) return
      void request()
      const timer = setInterval(() => void request(), 60000)
      let stream
      try {
        stream = new EventSource(EVENTS_ENDPOINT)
        stream.onmessage = (event) => {
          try {
            const next = JSON.parse(event.data)
            if (next.kind !== 'balance') return
            sequence.current += 1
            setSnapshot(next)
            setBusy(false)
          } catch {}
        }
      } catch {}
      return () => { clearInterval(timer); stream?.close(); sequence.current += 1 }
    }, [enabled, source])
    if (!enabled) return null
    const money = (row, field) => new Intl.NumberFormat('zh-CN', {
      style: 'currency', currency: row.currency, minimumFractionDigits: 2, maximumFractionDigits: 4,
    }).format(row[field])
    const sourceLabel = snapshot?.source
      ? (snapshot.source === 'account' ? '已登录的 DeepSeek 账户' : 'DSH 模型设置中的 API Key')
      : '气泡显示总余额，下方可查看赠送／充值明细。'
    return React.createElement('div', { className: 'dshdfy-rows', 'data-testid': 'dsh-dafeiyu-balance' },
      React.createElement('div', { className: 'dshdfy-row' },
        React.createElement('div', { className: 'dshdfy-text' },
          React.createElement('span', { className: 'dshdfy-label' }, 'DeepSeek 余额'),
          React.createElement('span', { className: 'dshdfy-hint' }, sourceLabel),
        ),
        React.createElement('div', { className: 'dshdfy-control' },
          React.createElement('button', { type: 'button', className: 'dshdfy-button', disabled: busy, onClick: () => void request(true) },
            busy ? '查询中…' : '刷新余额'),
        ),
      ),
      React.createElement('div', { className: 'dshdfy-body' },
        snapshot?.balances?.length ? React.createElement('table', { className: 'dshdfy-table' },
          React.createElement('thead', null, React.createElement('tr', null,
            ...['币种', '总余额', '赠送', '充值'].map((label) => React.createElement('th', { key: label, scope: 'col' }, label)),
          )),
          React.createElement('tbody', null, ...snapshot.balances.map((row) => React.createElement('tr', { key: row.currency },
            React.createElement('th', { scope: 'row' }, row.currency),
            ...['total', 'granted', 'toppedUp'].map((field) => React.createElement('td', { key: field }, money(row, field))),
          ))),
        ) : null,
        snapshot?.error ? React.createElement('p', { className: 'dshdfy-note', 'data-error': true, role: 'status' }, snapshot.error) : null,
        snapshot?.available === false ? React.createElement('p', { className: 'dshdfy-note', role: 'status' }, '账户当前没有可用余额。') : null,
        snapshot?.checkedAt ? React.createElement('p', { className: 'dshdfy-note', role: 'status' },
          `${snapshot.status === 'error' ? '上次成功查询' : '更新时间'}：${new Date(snapshot.checkedAt).toLocaleTimeString()} · 每分钟自动刷新`,
        ) : !snapshot?.error ? React.createElement('p', { className: 'dshdfy-note', role: 'status' }, '正在查询余额…') : null,
      ),
    )
  }

  function BigFishCard({ view } = {}) {
    const [status, setStatus] = useState('loading')
    const [value, setValue] = useState({})
    const [busy, setBusy] = useState(false)
    const patchSeq = useRef(0)
    const sliderTimers = useRef(new Map())
    const writable = status === 'ready' && !busy
    useSettingsStyle()
    useEffect(() => {
      let active = true
      fetch(CONFIG_ENDPOINT, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) throw new Error(`settings request failed: ${response.status}`)
          return response.json()
        })
        .then((next) => { if (active) { setValue(next); setStatus('ready') } })
        .catch(() => { if (active) setStatus('unavailable') })
      return () => {
        active = false
        for (const timer of sliderTimers.current.values()) clearTimeout(timer)
        sliderTimers.current.clear()
      }
    }, [])
    const write = async (field, next) => {
      const seq = ++patchSeq.current
      setBusy(true)
      try {
        const response = await fetch(CONFIG_ENDPOINT, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ [field]: next }),
        })
        if (!response.ok) throw new Error(`settings write failed: ${response.status}`)
        const updated = await response.json()
        if (seq === patchSeq.current) {
          setValue(updated)
          setStatus('ready')
        }
      } catch {
        if (seq === patchSeq.current) setStatus('unavailable')
      } finally {
        if (seq === patchSeq.current) setBusy(false)
      }
    }
    const writeSlider = (field, next) => {
      // Keep the slider responsive while dragging: update the local value
      // immediately and send a single debounced PATCH once the user pauses.
      setValue((prev) => ({ ...prev, [field]: next }))
      // Invalidate any in-flight write so a stale response cannot overwrite
      // the optimistic slider value while the user keeps dragging.
      patchSeq.current += 1
      const pending = sliderTimers.current.get(field)
      if (pending) clearTimeout(pending)
      const timer = setTimeout(() => {
        sliderTimers.current.delete(field)
        void write(field, next)
      }, 250)
      sliderTimers.current.set(field, timer)
    }
    const bubbleMode = value.bubbleMode ?? 'always'
    const soundOn = value.soundEnabled !== false
    const rows = []
    let key = 0
    const push = (label, hint, control) => {
      rows.push(React.createElement(Row, { key: `row-${key++}`, label, hint }, control))
    }
    const group = (title) => {
      rows.push(React.createElement('h4', { key: `group-${key++}`, className: 'dshdfy-group' }, title))
    }
    if (status === 'ready' || status === 'unavailable') {
      push('启用大肥鱼', '关闭后立即退出；重新开启无需单独启动程序。',
        React.createElement(Toggle, {
          checked: value.enabled !== false, disabled: !writable,
          onChange: (next) => void write('enabled', next),
        }))
      group('外观')
      push('角色大小', '拖到合适尺寸后会立即保存。',
        [
          React.createElement('input', {
            key: 'range', type: 'range', className: 'dshdfy-slider', min: 0.55, max: 1.4, step: 0.05, value: value.scale ?? 1,
            disabled: status !== 'ready', 'aria-label': '角色大小',
            onChange: (event) => void writeSlider('scale', Number(event.target.value)),
          }),
          React.createElement('span', { key: 'value', className: 'dshdfy-value' }, `${Math.round((value.scale ?? 1) * 100)}%`),
        ])
      push('活跃程度', '待机动作结束后休息：安静 45～90 秒、标准 25～45 秒、活泼 12～22 秒。',
        React.createElement(Choice, {
          value: value.activityLevel ?? 'normal', disabled: !writable, ariaLabel: '活跃程度',
          options: [['quiet', '安静'], ['normal', '标准'], ['lively', '活泼']],
          onChange: (next) => void write('activityLevel', next),
        }))
      push('减少动态效果', '减少走动、循环帧和程序化晃动。',
        React.createElement(Toggle, {
          checked: value.reducedMotion === true, disabled: !writable,
          onChange: (next) => void write('reducedMotion', next),
        }))
      group('行为')
      push('响应子 Agent', '默认只跟随顶层任务，避免状态过度跳动。',
        React.createElement(Toggle, {
          checked: value.includeSubagents === true, disabled: !writable,
          onChange: (next) => void write('includeSubagents', next),
        }))
      push('页面内桌宠', '在 DSH 页面右下角显示一只跟随状态的小桌宠（纯装饰）；开关后刷新页面生效。',
        React.createElement(Toggle, {
          checked: value.webOverlay === true, disabled: !writable,
          onChange: (next) => void write('webOverlay', next),
        }))
      push('打开 DSH', '自动识别当前客户端；识别不准时可手动选择。',
        React.createElement(Choice, {
          value: value.clientTarget ?? 'auto', disabled: !writable, ariaLabel: '打开 DSH',
          options: [['auto', '自动识别'], ['web', 'WebUI'], ['desktop', '桌面端']],
          onChange: (next) => void write('clientTarget', next),
        }))
      group('提醒')
      push('提示音', '所有提示的总开关（只影响声音）。',
        React.createElement(Toggle, {
          checked: soundOn, disabled: !writable,
          onChange: (next) => void write('soundEnabled', next),
        }))
      if (soundOn) {
        push('提示音与通知场景', '分别选择对话结束、工具出错和等待审批时是否提示。取消勾选后该场景不再播放提示音；macOS 也不再弹出系统通知横幅。Windows / Linux 只播放声音。',
          React.createElement(ChipGroup, {
            value: value.soundStates ?? ['SUCCESS', 'ERROR'], options: SOUND_STATE_OPTIONS,
            disabled: !writable, onChange: (next) => void write('soundStates', next),
          }))
      }
      group('气泡')
      push('气泡显示', '常驻显示、完全隐藏，或自定义哪些状态显示气泡。',
        React.createElement(Choice, {
          value: bubbleMode, disabled: !writable, ariaLabel: '气泡显示',
          options: [['always', '常驻显示'], ['hidden', '完全隐藏'], ['custom', '自定义显示状态']],
          onChange: (next) => void write('bubbleMode', next),
        }))
      if (bubbleMode !== 'hidden') {
        push('气泡大小', '和角色大小互相独立。',
          [
            React.createElement('input', {
              key: 'range', type: 'range', className: 'dshdfy-slider', min: 0.8, max: 1.2, step: 0.05, value: value.bubbleScale ?? 1,
              disabled: status !== 'ready', 'aria-label': '气泡大小',
              onChange: (event) => void writeSlider('bubbleScale', Number(event.target.value)),
            }),
            React.createElement('span', { key: 'value', className: 'dshdfy-value' }, `${Math.round((value.bubbleScale ?? 1) * 100)}%`),
          ])
      }
      if (bubbleMode === 'custom') {
        push('自定义显示状态', '勾选后，只有这些状态出现时才会显示气泡。',
          React.createElement(ChipGroup, {
            value: value.bubbleStates ?? ['SUCCESS', 'ERROR', 'WAITING'], options: BUBBLE_STATE_OPTIONS,
            disabled: !writable, onChange: (next) => void write('bubbleStates', next),
          }))
      }
      group('余额')
      push('显示余额', '气泡显示总余额，下方可查看赠送／充值明细。',
        React.createElement(Toggle, {
          checked: value.balanceEnabled !== false, disabled: !writable,
          onChange: (next) => void write('balanceEnabled', next),
        }))
      push('余额来源', '自动模式优先使用 API Key；账户余额和 API Key 余额可能不同。',
        React.createElement(Choice, {
          value: value.balanceSource ?? 'auto', disabled: !writable, ariaLabel: '余额来源',
          options: [['auto', '自动'], ['api-key', 'API Key'], ['account', '已登录账户']],
          onChange: (next) => void write('balanceSource', next),
        }))
    }
    const body = status === 'unavailable'
      ? React.createElement('p', { className: 'dshdfy-note', 'data-error': true, role: 'status' }, '大肥鱼设置尚未连接到 DSH Host。')
      : status === 'loading'
      ? React.createElement('p', { className: 'dshdfy-note', role: 'status' }, '正在读取设置…')
      : React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'dshdfy-rows' }, ...rows),
        React.createElement(BalanceCard, {
          enabled: value.balanceEnabled !== false && value.enabled !== false,
          source: value.balanceSource ?? 'auto',
        }),
        busy ? React.createElement('p', { className: 'dshdfy-note', role: 'status' }, '正在保存…') : null,
      )
    return React.createElement(view === 'page' ? 'section' : 'li', { className: 'dshdfy-section', 'data-testid': 'dsh-dafeiyu-settings' },
      React.createElement('div', { className: 'dshdfy-head' },
        React.createElement('h3', { className: 'dshdfy-title' }, '大肥鱼桌面伴侣'),
        React.createElement('p', { className: 'dshdfy-intro' }, '跟随 DSH WebUI 或桌面端启动，在桌面上显示任务状态和余额。'),
      ),
      body,
    )
  }

  // In-page companion (opt-in via the webOverlay setting). Purely decorative:
  // it mirrors the DSH state as a small looping sprite in the page corner and
  // never blocks or outlives the page. Every failure path ends in "no pet",
  // never in an exception reaching the WebUI.
  function PetOverlay() {
    const [src, setSrc] = useState(null)
    useEffect(() => {
      let alive = true
      let raf = 0
      let source = null
      fetch(MANIFEST_ENDPOINT, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('manifest'))))
        .then((manifest) => {
          if (!alive) return
          const runtime = { name: '', frames: [], frameMs: 42, loop: true, index: 0, base: 'idle', pulseUntil: 0, reducedMotion: false }
          let preloader = null
          let spent = 0
          const applyClip = (name) => {
            if (runtime.name === name) return
            const clip = manifest.clips[name] || manifest.clips.idle
            runtime.name = name
            runtime.frames = clip.frames
            runtime.frameMs = clip.frameMs || 42
            runtime.loop = clip.loop !== false
            runtime.index = 0
            spent = 0
          }
          const frameUrl = (frame) => FRAME_ENDPOINT + '?frame=' + encodeURIComponent(frame)
          const show = () => {
            if (!alive || runtime.frames.length === 0) return
            setSrc(frameUrl(runtime.frames[runtime.index]))
            if (runtime.frames.length > 1 && typeof Image === 'function') {
              try {
                preloader = preloader || new Image()
                preloader.src = frameUrl(runtime.frames[(runtime.index + 1) % runtime.frames.length])
              } catch {}
            }
          }
          applyClip('idle')
          show()
          if (typeof requestAnimationFrame !== 'function') return
          let previous = 0
          const step = (now) => {
            if (!alive) return
            if (runtime.pulseUntil && Date.now() >= runtime.pulseUntil) {
              runtime.pulseUntil = 0
              applyClip(runtime.base)
              previous = now
              show()
            }
            if (previous && !runtime.reducedMotion) {
              spent += now - previous
              if (spent >= runtime.frameMs) {
                const frames = Math.floor(spent / runtime.frameMs)
                spent %= runtime.frameMs
                runtime.index = runtime.loop
                  ? (runtime.index + frames) % runtime.frames.length
                  : Math.min(runtime.index + frames, runtime.frames.length - 1)
                show()
              }
            }
            previous = now
            raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
          if (typeof EventSource !== 'undefined') {
            try {
              source = new EventSource(EVENTS_ENDPOINT)
              source.onmessage = (event) => {
                try {
                  const message = JSON.parse(event.data)
                  const clipFor = (state, activity) => state === 'WORKING' && manifest.workingActivityMap?.[activity]
                    || manifest.stateMap[state] || 'idle'
                  if (message.kind === 'config') runtime.reducedMotion = message.reducedMotion === true
                  if (message.kind === 'state' && message.state && manifest.stateMap[message.state]) {
                    runtime.base = clipFor(message.state, message.activity)
                    if (message.state !== 'IDLE') runtime.pulseUntil = 0
                    if (!runtime.pulseUntil) applyClip(runtime.base)
                  }
                  if (message.kind === 'task' && message.state === 'WORKING' && message.activity
                    && manifest.workingActivityMap && manifest.workingActivityMap[message.activity]) {
                    runtime.base = clipFor('WORKING', message.activity)
                    if (!runtime.pulseUntil) applyClip(runtime.base)
                  }
                  if (message.kind === 'pulse' && manifest.stateMap[message.state] && message.ttlMs > 0) {
                    runtime.base = clipFor(message.resumeState, message.resumeActivity)
                    const name = clipFor(message.state)
                    const clip = manifest.clips[name]
                    const duration = runtime.reducedMotion ? 0 : clip.frames.length * clip.frameMs
                    const deadline = runtime.name === name ? runtime.pulseUntil : 0
                    runtime.pulseUntil = Math.max(Date.now() + message.ttlMs, deadline || Date.now() + duration)
                    applyClip(name)
                  }
                  show()
                } catch {}
              }
            } catch {}
          }
        })
        .catch(() => {})
      return () => {
        alive = false
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
        try { source?.close() } catch {}
      }
    }, [])
    if (!src) return null
    return React.createElement('img', {
      src, alt: '', 'aria-hidden': true, draggable: false,
      style: {
        position: 'fixed', right: 16, bottom: 12, width: 132, zIndex: 2147483000,
        pointerEvents: 'none', userSelect: 'none', opacity: 0.96,
        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
      },
    })
  }

  const HOME_PANEL_ID = 'dafeiyu-home'
  const VISIBILITY_ENDPOINT = '/plugins/dsh-dafeiyu/visibility'
  const REPORT_ENDPOINT = '/plugins/dsh-dafeiyu/report'

  /// The home view owns the character while it is open: the desktop panel steps
  /// aside on mount and returns when the user navigates to another panel.
  function useHomeVisibility() {
    useEffect(() => {
      const send = (visible) => {
        try {
          void fetch(VISIBILITY_ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ visible }),
          })
        } catch {}
      }
      send(false)
      return () => send(true)
    }, [])
  }

  function HomeIcon({ size } = {}) {
    const dimension = typeof size === 'number' ? size : 20
    return React.createElement('svg', {
      width: dimension, height: dimension, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
    },
    React.createElement('path', {
      d: 'M4 11.2 12 4.4l8 6.8', stroke: 'currentColor', strokeWidth: 1.7,
      strokeLinecap: 'round', strokeLinejoin: 'round',
    }),
    React.createElement('path', {
      d: 'M6.2 10.6v9h11.6v-9', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round',
    }),
    React.createElement('path', {
      d: 'M9.7 15.1c1.5-1.3 3.1-1.3 4.6 0-1.5 1.3-3.1 1.3-4.6 0Z', fill: 'currentColor',
    }))
  }

  function HomePage() {
    const [manifest, setManifest] = useState(null)
    const [clipName, setClipName] = useState('idle')
    const [frameIndex, setFrameIndex] = useState(0)
    const [message, setMessage] = useState('我在这儿等新任务哦')
    const [balance, setBalance] = useState('')
    const clipRef = useRef('idle')
    useHomeVisibility()

    useEffect(() => {
      let alive = true
      fetch(MANIFEST_ENDPOINT, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('manifest'))))
        .then((next) => { if (alive) setManifest(next) })
        .catch(() => {})
      return () => { alive = false }
    }, [])

    // The event stream only carries balance changes, so ask once on mount.
    useEffect(() => {
      let alive = true
      fetch(BALANCE_ENDPOINT, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((snapshot) => {
          if (alive && snapshot && typeof snapshot.summary === 'string') setBalance(snapshot.summary)
        })
        .catch(() => {})
      return () => { alive = false }
    }, [])

    useEffect(() => {
      if (typeof EventSource === 'undefined') return undefined
      const source = new EventSource(EVENTS_ENDPOINT)
      source.onmessage = (event) => {
        try {
          const next = JSON.parse(event.data)
          if (next.kind === 'state' && next.state && manifest) {
            const name = manifest.stateMap?.[next.state] ?? 'idle'
            clipRef.current = name
            setClipName(name)
            setFrameIndex(0)
            if (next.message) setMessage(String(next.message))
          }
          if (next.kind === 'balance' && next.summary) setBalance(String(next.summary))
        } catch {}
      }
      return () => source.close()
    }, [manifest])

    useEffect(() => {
      if (!manifest) return undefined
      const clip = manifest.clips?.[clipName] ?? manifest.clips?.idle
      if (!clip || !clip.frames?.length) return undefined
      const timer = setInterval(() => {
        setFrameIndex((current) => (current + 1) % clip.frames.length)
      }, clip.frameMs || 42)
      return () => clearInterval(timer)
    }, [manifest, clipName])

    const clip = manifest?.clips?.[clipName] ?? manifest?.clips?.idle
    const frame = clip?.frames?.[frameIndex % (clip?.frames?.length || 1)]
    const source = frame ? FRAME_ENDPOINT + '?frame=' + encodeURIComponent(frame) : undefined

    return React.createElement('section', {
      style: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, minHeight: '100%', padding: '40px 24px', color: 'var(--dsw-alias-label-primary)',
        background: 'radial-gradient(circle at 50% 38%, var(--dsw-alias-bg-layer-3, #eef1f6) 0%, transparent 62%)',
      },
    },
    React.createElement('div', {
      style: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '20px 28px 26px', borderRadius: 20,
        background: 'var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.72))',
        boxShadow: '0 12px 36px rgba(20, 26, 38, 0.08)',
      },
    },
    source
      ? React.createElement('img', {
          src: source, alt: '大肥鱼', draggable: false,
          style: { width: 240, height: 'auto', imageRendering: 'auto', userSelect: 'none' },
        })
      : React.createElement('div', { style: { width: 240, height: 240 } }),
    React.createElement('strong', { style: { fontSize: 16, fontWeight: 600 } }, '大肥鱼'),
    React.createElement('span', {
      style: { fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' },
    }, message),
    balance
      ? React.createElement('span', {
          style: { marginTop: 6, fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', fontVariantNumeric: 'tabular-nums' },
        }, balance)
      : null,
    React.createElement('span', {
      style: { marginTop: 14, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-quaternary, var(--dsw-alias-label-tertiary))', textAlign: 'center', maxWidth: 320 },
    }, '她在家陪你。切到别的面板，她会回到桌面上继续跟着任务。'),
    ),
    )
  }

  function reportSlots(results) {
    // Loopback diagnostic: the renderer has no console we can read, so the
    // outcome of each slot registration goes to the host log.
    try {
      const request = fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage: 'home-slots', results }),
      })
      if (request && typeof request.catch === 'function') request.catch(() => {})
    } catch {}
  }

  function registerHome(ctx) {
    const layout = ctx.layout ?? (typeof ctx.get === 'function' ? ctx.get('layout') : undefined)
    const canOpenPanel = layout !== undefined && typeof layout.selectPanel === 'function'
    const openHome = () => { if (canOpenPanel) layout.selectPanel(HOME_PANEL_ID) }

    const HomeButton = () => {
      useSettingsStyle()
      const buttonRef = useRef(null)
      useEffect(() => {
        const timer = setTimeout(() => {
          const node = buttonRef.current
          if (!node) { reportSlots([{ slot: 'settings.action-mount', ok: false }]); return }
          const rect = node.getBoundingClientRect()
          const chain = []
          let parent = node.parentElement
          for (let depth = 0; parent && depth < 4; depth += 1) {
            const box = parent.getBoundingClientRect()
            chain.push({ w: Math.round(box.width), h: Math.round(box.height), display: getComputedStyle(parent).display })
            parent = parent.parentElement
          }
          reportSlots([{ slot: 'settings.action-mount', ok: true, rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }, chain }])
        }, 400)
        return () => clearTimeout(timer)
      }, [])
      return React.createElement('button', {
        ref: buttonRef,
        type: 'button',
        className: 'dshdfy-homebtn',
        title: '大肥鱼的家',
        'aria-label': '大肥鱼的家',
        onClick: openHome,
      },
      React.createElement(HomeIcon, { size: 18 }),
      React.createElement('span', { className: 'dshdfy-homebtn-label' }, '大肥鱼的家'))
    }

    const results = []
    let mounted = false
    const register = (slot, options, component) => {
      try {
        ctx.slots.inject(slot, () => {
          try {
            ctx.slots.register(options, component)
            mounted = true
            results.push({ slot, ok: true })
          } catch (error) {
            results.push({ slot, ok: false, error: String(error && error.message ? error.message : error) })
          }
        })
        return true
      } catch (error) {
        results.push({ slot, ok: false, error: String(error && error.message ? error.message : error) })
        return false
      }
    }

    register('main', { name: 'main', key: HOME_PANEL_ID, order: 60 }, HomePage)

    // The trailing settings-row seat only exists on DSH builds that declare
    // it; injection waits for a declaration, so an unknown slot stays silent
    // rather than throwing. Watch for the mount and fall back to a normal
    // panel row when the seat never appears.
    register('sidebar.footer.action', { name: 'sidebar.footer.action', id: HOME_PANEL_ID, order: 10 }, HomeButton)
    setTimeout(() => {
      if (mounted) return
      results.push({ slot: 'sidebar.footer.action', ok: 'missing' })
      register('sidebar.panellist', { name: 'sidebar.panellist', id: HOME_PANEL_ID, order: 60, label: () => '大肥鱼的家' }, HomeIcon)
      reportSlots(results)
    }, 1500)
    reportSlots(results)
  }

  function registerWebOverlay(ctx) {
    const registerOverlay = () => {
      try {
        ctx.slots.register({ name: 'shell.overlay', id: 'dsh-dafeiyu-overlay', order: 999 }, () =>
          React.createElement(PetOverlay, {}))
      } catch (error) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-dafeiyu] failed to register web overlay:', error)
        }
      }
    }
    try {
      ctx.slots.inject('shell.overlay', registerOverlay)
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[dsh-dafeiyu] failed to inject overlay slot:', error)
      }
    }
  }

  function apply(ctx) {
    // If DSH changes the slot contract again, fail this card quietly instead of failing the whole
    // WebUI load (that regressed before as 'other plugins stop working').
    // The guard must live INSIDE the inject callback because DSH may invoke
    // it asynchronously, outside any try around the inject() call itself.
    const registerCard = (slot) => () => {
      try {
        ctx.slots.register({
          name: slot, key: 'dsh-dafeiyu', id: 'dsh-dafeiyu', order: 30,
          label: () => '大肥鱼',
          inject: () => ({}),
        }, BigFishCard)
      } catch (error) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-dafeiyu] failed to register settings card:', error)
        }
      }
    }
    for (const slot of ['plugins.bundle.config', 'settings.plugins.tab', 'settings.plugin.item']) {
      try {
        ctx.slots.inject(slot, registerCard(slot))
      } catch (error) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-dafeiyu] failed to inject settings slot:', error)
        }
      }
    }

    // The home panel and its sidebar entry are always available; the pet's
    // desktop window hides while the panel is open.
    registerHome(ctx)

    // The in-page pet is opt-in; read the local config once at mount. Any
    // failure (endpoint absent, offline host, closed page) just means no pet.
    try {
      fetch(CONFIG_ENDPOINT, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((config) => {
          if (config && config.webOverlay === true) registerWebOverlay(ctx)
        })
        .catch(() => {})
    } catch {}
  }

  module.exports = {
    name: 'dsh-dafeiyu-client',
    inject: ['slots', 'layout'],
    apply,
  }
  return module.exports
} })
