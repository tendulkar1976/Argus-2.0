import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ILLUSTRATIVE_MODELS } from '@/services/mockOptimizer';
import { OptimizationMode, TargetModel, OllamaStatus, ModelCatalogItem } from '@/types';
import { Zap, Sliders, ShieldAlert, AlertCircle, CheckCircle, Route, Bot } from 'lucide-react';

export interface OptimizationControlsProps {
  mode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  targetModel: TargetModel;
  onTargetModelChange: (model: TargetModel) => void;
  onOptimize: () => void;
  isLoading: boolean;
  disabled: boolean;
  ollamaStatus?: OllamaStatus | null;
  enableRouting?: boolean;
  onEnableRoutingChange?: (enabled: boolean) => void;
  requestedModel?: string;
  onRequestedModelChange?: (model: string) => void;
  discoveredModels?: ModelCatalogItem[];
  downstreamModel?: string;
  onDownstreamModelChange?: (model: string) => void;
  trials?: number;
  onTrialsChange?: (trials: number) => void;
  onCompare?: () => void;
  isComparing?: boolean;
  benchmarkFirst?: boolean;
}

export const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  mode,
  onModeChange,
  targetModel,
  onTargetModelChange,
  onOptimize,
  isLoading,
  disabled,
  ollamaStatus,
  enableRouting = true,
  onEnableRoutingChange,
  requestedModel = '',
  onRequestedModelChange,
  discoveredModels = [],
  trials = 1,
  onTrialsChange,
  onCompare,
  isComparing = false,
  benchmarkFirst = false,
}) => {
  const isOllamaReady = Boolean(ollamaStatus?.connected && ollamaStatus?.model_installed);

  const modes: { id: OptimizationMode; title: string }[] = [
    {
      id: 'balanced',
      title: 'Balanced',
    },
    {
      id: 'concise',
      title: 'Concise',
    },
    {
      id: 'structure',
      title: 'Structure-focused',
    },
  ];

  return (
    <Card
      title="Optimization Controls"
      className="space-y-5"
    >
      {/* Local LLM Inference Engine Status Banner */}
      {isOllamaReady ? (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
          <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-cyan-300">
              Local LLM Active ({ollamaStatus?.model || ''})
            </span>

          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300">Local Model Offline</span>
            <p className="text-[11px]">Connect Ollama or use Cloud Studio.</p>
          </div>
        </div>
      )}

      <fieldset disabled={isLoading || isComparing} className="min-w-0"><details className="studio-advanced"><summary><Sliders size={16}/>Advanced settings</summary>
      {/* Phase 5: Local Optimizer Model Routing Bar */}
      <div className="p-3.5 rounded-lg bg-[#080d19] border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            Model routing
          </label>
          {onEnableRoutingChange && (
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-cyan-300">
              <input
                type="checkbox"
                checked={enableRouting}
                onChange={(e) => onEnableRoutingChange(e.target.checked)}
                className="rounded border-white/20 bg-[#0c1424] text-cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Auto-Route</span>
            </label>
          )}
        </div>

        {!enableRouting && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Manual Local Model Override:</span>
              <span>Installed: {discoveredModels.length || ollamaStatus?.available_models.length || 0}</span>
            </div>
            <select
              value={requestedModel || (ollamaStatus?.model || '')}
              onChange={(e) => onRequestedModelChange && onRequestedModelChange(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#0c1424] border border-white/10 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            >
              {discoveredModels.length > 0 ? (
                discoveredModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.parameter_size || m.tier}) {m.is_loaded ? '• [resident in VRAM]' : ''}
                  </option>
                ))
              ) : (
                (ollamaStatus?.available_models || []).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Optimization Mode
          </label>
          <div className="space-y-1.5">
            {modes.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  mode === m.id
                    ? 'bg-cyan-950/50 border-cyan-500/50 text-slate-100'
                    : 'bg-[#080d19] border-white/5 text-slate-400 hover:border-white/10 hover:bg-[#0c1424]'
                }`}
              >
                <input
                  type="radio"
                  name="optimization-mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => onModeChange(m.id)}
                  className="mt-1 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 bg-[#080d19] border-white/20"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    {m.title}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Target Model, Downstream Model & Actions */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Target model (estimate) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="target-model-select" className="text-xs font-semibold text-slate-200">
                  Target Model (Illustrative)
                </label>

              </div>

              <select
                id="target-model-select"
                value={targetModel}
                onChange={(e) => onTargetModelChange(e.target.value as TargetModel)}
                className="w-full p-2 rounded-lg bg-[#080d19] border border-white/10 text-slate-200 text-xs font-medium focus:outline-none focus:border-cyan-500/50"
              >
                {ILLUSTRATIVE_MODELS.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[#0b1324] text-slate-200">
                    {model.name} ({model.provider}) &bull; {model.contextWindow}
                  </option>
                ))}
              </select>
            </div>

            {/* Finding 1: Measurement Trials Selector */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-[11px] font-mono text-slate-300">Trials:</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => onTrialsChange && onTrialsChange(1)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    trials === 1
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-[#080d19] text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => onTrialsChange && onTrialsChange(3)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    trials === 3
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-[#080d19] text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  3
                </button>
              </div>
            </div>
          </div>

          </div></div></details></fieldset>
          {/* Action Triggers: Compare Outputs and Optimize Prompt */}
          <div className="studio-actions">
            {benchmarkFirst && onCompare && (
              <Button
                variant={benchmarkFirst?'primary':'outline'}
                size="lg"
                className={benchmarkFirst?'studio-primary font-semibold':'font-semibold'}
                onClick={onCompare}
                disabled={disabled || isLoading || isComparing}
                isLoading={isComparing}
              >
                <Bot className="w-4 h-4 text-navy-950" />
                <span>{isComparing ? 'Running Output Comparison...' : 'Compare responses'}</span>
              </Button>
            )}

            <Button
              variant={benchmarkFirst?'outline':'primary'}
              size="lg"
              className={benchmarkFirst?'font-semibold':'studio-primary font-semibold'}
              onClick={onOptimize}
              disabled={disabled || isLoading || isComparing}
              isLoading={isLoading}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isLoading ? 'Optimizing Prompt...' : 'Optimize prompt'}</span>
            </Button>

            {disabled && !isLoading && !isComparing && (
              <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                Enter prompt text above to enable execution
              </p>
            )}
          </div>
    </Card>
  );
};
