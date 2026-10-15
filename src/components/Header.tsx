import React from 'react';
import { Volume2, VolumeX, RotateCcw, FileText, Radio, ShieldAlert, Compass } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onResetGrid: () => void;
  onOpenManifest: () => void;
  onOpenSetup: () => void;
  activeHazardsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  onToggleMute,
  onResetGrid,
  onOpenManifest,
  onOpenSetup,
  activeHazardsCount,
}) => {
  return (
    <header className="border-b border-[#292929] bg-[#0F0F0F]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] font-sans">
                BEACON
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                Offline Active
              </span>
            </div>
            <p className="text-xs text-[#A0A0A0] font-sans">
              Offline Survival Route Planner
            </p>
          </div>
        </div>

        {/* Telemetry quick status */}
        <div className="hidden md:flex items-center gap-6 text-xs text-[#A0A0A0] font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[#A0A0A0]">Grid:</span>
            <span className="text-[#FAFAFA] font-medium">40-Sector Regional Grid (8x5)</span>
          </div>
          <span className="text-[#292929]" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[#A0A0A0]">Algorithm:</span>
            <span className="text-[#F59E0B] font-semibold">Dijkstra Shortest Path</span>
          </div>
          <span className="text-[#292929]" aria-hidden="true">|</span>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span className="text-[#A0A0A0]">Threats:</span>
            <span className="text-[#F43F5E] tabular-nums font-semibold">{activeHazardsCount} Active</span>
          </div>
        </div>

        {/* Action Zone */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
            aria-label={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
            className="p-2 rounded-md border border-[#292929] bg-[#202020] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838] transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#A0A0A0]" /> : <Volume2 className="w-4 h-4 text-[#F59E0B]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenSetup();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B]/20 hover:border-[#F59E0B]/50 transition-colors cursor-pointer"
            title="Configure Base Camp, Current Supplies & Traversal Strategy"
          >
            <Compass className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Expedition Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenManifest();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#292929] bg-[#202020] text-xs font-medium text-[#FAFAFA] hover:border-[#383838] hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Briefing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onResetGrid();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#292929] bg-[#202020] text-xs font-medium text-[#FAFAFA] hover:border-[#383838] hover:bg-[#252525] transition-colors cursor-pointer"
            title="Reset Grid to Initial Conditions"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span>Reset Map</span>
          </button>
        </div>
      </div>
    </header>
  );
};
