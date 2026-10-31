import React, { useState } from 'react';
import { X, Zap, Clock, ShieldCheck, CheckCircle2, ChevronRight, Award, Compass, ArrowRight } from 'lucide-react';
import { SPEED_BENCHMARKS, COMPETITOR_COMPARISON } from '../../data/wheelPacks';

interface SpeedBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDrill: () => void;
}

export const SpeedBenchmarkModal: React.FC<SpeedBenchmarkModalProps> = ({
  isOpen,
  onClose,
  onOpenDrill,
}) => {
  const [activeTab, setActiveTab] = useState<'speed' | 'competitors' | 'lineage' | 'trust'>('speed');
  const [actionsPerDay, setActionsPerDay] = useState<number>(65);

  if (!isOpen) return null;

  // Time saved calculation
  // Start menu ~3.45s vs Radial flick ~0.22s = 3.23s saved per action
  const secondsSavedPerAction = 3.23;
  const hoursSavedPerYear = Math.round(((actionsPerDay * secondsSavedPerAction * 250) / 3600) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Speed Benchmarks & Interaction Lineage</span>
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded font-mono">
                  Verified Data
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Fitts's Law mathematics, marking menu genealogy & head-to-head architectural comparisons
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('speed')}
            className={`px-3.5 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'speed'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Speed Proof & Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`px-3.5 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'competitors'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Competitor Architecture Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('lineage')}
            className={`px-3.5 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'lineage'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Fitts's Law & Pie Menus Lineage</span>
          </button>
          <button
            onClick={() => setActiveTab('trust')}
            className={`px-3.5 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'trust'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trust & Security Guarantee</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {activeTab === 'speed' && (
            <div className="space-y-6">
              {/* Benchmark Grid */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>Execution Latency Benchmark (Measured Times)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SPEED_BENCHMARKS.map((b, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        b.method.includes('Radial')
                          ? 'bg-sky-950/40 border-sky-500/50 shadow-lg shadow-sky-950/30 ring-1 ring-sky-500/30'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-white">{b.method}</span>
                        <span
                          className={`font-mono text-base font-bold ${
                            b.method.includes('Radial') ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {b.timeSeconds}s
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Physical Interaction Steps:</span>
                          <span className="font-mono text-slate-300">{b.stepsCount} steps</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cognitive Friction:</span>
                          <span
                            className={
                              b.cognitiveLoad.includes('Zero')
                                ? 'text-emerald-400 font-semibold'
                                : 'text-amber-400'
                            }
                          >
                            {b.cognitiveLoad}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{b.fittsDistance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annual Time Saved Calculator */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-sky-950/40 border border-sky-500/30 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Annual Productivity Savings Calculator</h4>
                    <p className="text-[11px] text-slate-400">
                      Based on 3.23s saved per app launch / file open / system command
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-400 uppercase font-mono block">Estimated Annual Focus Gain</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      +{hoursSavedPerYear} Hours / Year
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Your Daily Command Executions:</span>
                    <span className="text-sky-400 font-bold">{actionsPerDay} actions/day</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="200"
                    step="5"
                    value={actionsPerDay}
                    onChange={(e) => setActionsPerDay(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Casual (15/day)</span>
                    <span>Power User (65/day)</span>
                    <span>Developer / Video Editor (200/day)</span>
                  </div>
                </div>
              </div>

              {/* CTA to practice */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Ready to train sub-200ms flick reflex?</span>
                  <span className="text-[11px] text-slate-400">Try the interactive Muscle Memory Arena.</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDrill();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>Open Reflex Trainer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Architectural Comparison Matrix</h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Why Radial Access is built with native PyQt6 & Win32 memory management instead of Electron or keyloggers.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-300">
                      <th className="p-3 font-semibold">Evaluation Criteria</th>
                      <th className="p-3 font-semibold text-sky-400">OrbitRadial / Radial Access</th>
                      <th className="p-3 font-semibold text-slate-400">Kando</th>
                      <th className="p-3 font-semibold text-slate-400">Logitech Ring</th>
                      <th className="p-3 font-semibold text-slate-400">Raycast / Flow</th>
                      <th className="p-3 font-semibold text-slate-400">AutoHotkey</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {COMPETITOR_COMPARISON.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-slate-200">{row.feature}</td>
                        <td className="p-3 font-semibold text-emerald-300 bg-sky-950/20">{row.radialAccess}</td>
                        <td className="p-3 text-slate-400">{row.kando}</td>
                        <td className="p-3 text-slate-400">{row.logitechRing}</td>
                        <td className="p-3 text-slate-400">{row.raycastFlow}</td>
                        <td className="p-3 text-slate-400">{row.autohotkey}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lineage' && (
            <div className="space-y-4 leading-relaxed">
              <h3 className="text-sm font-bold text-white">The Scientific Pedigree of Radial Marking Menus</h3>
              
              <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2">
                <h4 className="font-semibold text-sky-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>The Real Fitts's Law Advantage: Angular Width & Infinite Depth</span>
                </h4>
                <p className="text-slate-300">
                  Fitts's Law predicts movement time as <code className="text-sky-300 font-mono">MT = a + b · log₂(2D / W)</code>, where <code className="text-sky-300 font-mono">D</code> is distance to target and <code className="text-sky-300 font-mono">W</code> is target width.
                </p>
                <p className="text-slate-400">
                  In traditional menus, targets are linear rows with small heights (<code className="text-slate-300 font-mono">W ≈ 24px</code>). In Radial Access:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-white">Zero Starting Travel:</strong> The menu spawns directly centered on cursor coordinates (<code className="text-sky-300 font-mono">D = 0</code>).</li>
                  <li><strong className="text-white">Equidistant Geometry:</strong> Every item sits at identical distance, eliminating visual scan delays.</li>
                  <li><strong className="text-white">Infinite Wedge Targets:</strong> Targets are angular sectors (<code className="text-sky-300 font-mono">θ = 360° / N</code>). As distance increases away from center, the target boundary expands indefinitely (<code className="text-sky-300 font-mono">W = 2r · sin(θ / 2)</code>), making overshooting physically impossible!</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white">Direct Lineage & Research Citations</h4>
                <div className="space-y-2 text-[11px] text-slate-400">
                  <p>
                    <strong className="text-slate-200">1. Gordon Kurtenbach & William Buxton (1993):</strong> <em>"The Limits of Expert Performance Using Hierarchic Marking Menus"</em> (CHI '93). Kurtenbach proved that users transition from visual guidance to open-loop ballistic motor memory, executing 8-item radial flicks in under 200 milliseconds.
                  </p>
                  <p>
                    <strong className="text-slate-200">2. Don Hopkins (1986):</strong> Pioneered Pie Menus in Unix X10 and SimCity, establishing circular ergonomic selection around pointer centers.
                  </p>
                  <p>
                    <strong className="text-slate-200">3. Spatial Constancy Principle:</strong> Item positions remain strictly fixed. Never auto-reordering sectors preserves subconscious muscular reflexes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trust' && (
            <div className="space-y-4 leading-relaxed">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Telemetry, Zero Keystroke Logging Guarantee</span>
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <h4 className="font-semibold text-emerald-400">100% Offline & Private</h4>
                <p className="text-slate-300">
                  Radial Access has no telemetry servers, no analytical trackers, and no network sockets open. It runs completely locally on your machine.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white">How Input Hooks Work (No Keylogging)</h4>
                <p className="text-slate-400">
                  Global triggers use <code className="text-slate-200 font-mono">pynput</code> to bind only your explicit shortcut (<code className="text-sky-300 font-mono">Middle Click</code> or <code className="text-sky-300 font-mono">Alt+G</code>). Keystrokes are never recorded, logged, or retained.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white">Windows SmartScreen & False Positives</h4>
                <p className="text-slate-400">
                  Because open-source PyInstaller executables are not signed with a multi-thousand dollar commercial Extended Validation (EV) certificate, Windows SmartScreen may show an untrusted warning on first run.
                </p>
                <p className="text-slate-400">
                  To verify complete code transparency, you can inspect every line of <code className="text-slate-200 font-mono">python-native/main.py</code> and build your own binary locally using <code className="text-slate-200 font-mono">build_exe.bat</code> in 30 seconds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Radial Access Interaction Lab</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
