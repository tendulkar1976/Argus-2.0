import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { estimateTokens } from '@/services/mockOptimizer';
import { ExamplePrompt } from '@/types';
import { Trash2, HelpCircle } from 'lucide-react';

export interface PromptEditorProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onSelectExample: (example: ExamplePrompt) => void;
  disabled?: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  onClear,
  disabled = false,
}) => {
  const metrics = estimateTokens(value);

  return (
    <Card
      title="Your prompt"
      badge={
        <div className="flex items-center gap-2">
          {value.trim().length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              className="text-slate-400 hover:text-red-400 text-xs py-1 px-2"
              title="Clear current prompt"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      }
      className="flex flex-col h-full"
    >
      {/* Textarea Input */}
      <div className="relative flex-1 flex flex-col min-h-[220px]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter a prompt with instructions, context, formatting requirements, or guidelines..."
          className="w-full flex-1 p-3.5 rounded-lg bg-[#080d19] border border-white/10 text-slate-100 placeholder:text-slate-600 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all disabled:opacity-50"
          rows={10}
          aria-label="Raw prompt text input"
        />

        {/* Counter & Token Approximation Bar */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-200">{metrics.charCount}</strong> chars
            </span>
            <span className="text-slate-600">&bull;</span>
            <span title="Estimated using ~4 characters/token approximation">
              ~<strong className="text-cyan-300">{metrics.estimatedTokens}</strong> tokens
              <span className="text-[10px] text-slate-500 ml-1">(est.)</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <HelpCircle className="w-3 h-3" />
            <span>~4 chars/token heuristic</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
