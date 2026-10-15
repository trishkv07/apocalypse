import React from 'react';
import { CellData, SupplyStationType, ThreatCategory, ThreatLevel } from '../types';
import { X, MapPin, Radio, ShieldAlert, Apple, Droplet, HeartPulse, Check, AlertOctagon, Skull, Ban, AlertTriangle, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface CellInspectorModalProps {
  cell: CellData | null;
  onClose: () => void;
  onUpdateCell: (updated: Partial<CellData>) => void;
  onSetStart: (cellId: string) => void;
  onSetDestination: (cellId: string) => void;
}

export const CellInspectorModal: React.FC<CellInspectorModalProps> = ({
  cell,
  onClose,
  onUpdateCell,
  onSetStart,
  onSetDestination,
}) => {
  if (!cell) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090909]/85 backdrop-blur-md flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-[#171717] border border-[#292929] rounded-xl max-w-md w-full p-5 shadow-2xl text-[#FAFAFA]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-[#292929]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#F59E0B]">{cell.id}</span>
              <span className="text-[#FAFAFA] font-semibold text-sm">{cell.name}</span>
            </div>
            <p className="text-[11px] text-[#A0A0A0] mt-0.5">
              Sector Coordinates: Row {cell.r + 1}, Column {cell.c + 1}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-md text-[#A0A0A0] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors cursor-pointer"
            aria-label="Close sector intel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Start / Evac role assignments */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-2">
            Base Station Role:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onSetStart(cell.id);
              }}
              className={`p-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                cell.isStart
                  ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981] font-bold'
                  : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838]'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#10B981]" />
              <span>{cell.isStart ? 'Current Start Base' : 'Set as Start'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onSetDestination(cell.id);
              }}
              className={`p-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                cell.isDestination
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] font-bold'
                  : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA] hover:border-[#383838]'
              }`}
            >
              <Radio className="w-4 h-4 text-[#F59E0B]" />
              <span>{cell.isDestination ? 'Current Evac Point' : 'Set as Evac'}</span>
            </button>
          </div>
        </div>

        {/* Threat Level */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-2">
            Threat Severity Level:
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { level: 0 as ThreatLevel, label: 'Safe', color: 'text-[#10B981]' },
              { level: 1 as ThreatLevel, label: 'Low', color: 'text-[#EAB308]' },
              { level: 2 as ThreatLevel, label: 'Med', color: 'text-[#F97316]' },
              { level: 3 as ThreatLevel, label: 'High', color: 'text-[#EF4444]' },
              { level: 4 as ThreatLevel, label: 'Blocked', color: 'text-[#F43F5E]' },
            ].map((t) => (
              <button
                key={t.level}
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateCell({ threatLevel: t.level });
                }}
                className={`py-2 px-1 rounded-md text-center border transition-colors cursor-pointer text-xs ${
                  cell.threatLevel === t.level
                    ? 'bg-[#292929] border-[#383838] font-bold ' + t.color + ' ring-1 ring-offset-1 ring-offset-[#171717] ring-[#F59E0B]'
                    : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Threat Category */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-2">
            Hazard Classification:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { cat: 'clear' as ThreatCategory, label: 'None', icon: ShieldCheck, color: 'text-[#10B981]' },
              { cat: 'patrol' as ThreatCategory, label: 'Hostiles', icon: Skull, color: 'text-[#EF4444]' },
              { cat: 'radiation' as ThreatCategory, label: 'Radiation', icon: ShieldAlert, color: 'text-[#F59E0B]' },
              { cat: 'rubble' as ThreatCategory, label: 'Rubble', icon: Ban, color: 'text-[#94A3B8]' },
              { cat: 'biohazard' as ThreatCategory, label: 'Biohazard', icon: AlertTriangle, color: 'text-[#10B981]' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.cat}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onUpdateCell({ threatCategory: item.cat });
                  }}
                  className={`p-2 rounded-md border text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    cell.threatCategory === item.cat
                      ? 'bg-[#292929] border-[#EF4444]/60 text-[#FAFAFA] font-medium'
                      : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Supply Cache Assignment */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-2">
            Supply Depot Content:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { type: 'none' as SupplyStationType, label: 'None', icon: null, color: '' },
              { type: 'food' as SupplyStationType, label: '+4 Food', icon: Apple, color: 'text-[#F59E0B]' },
              { type: 'water' as SupplyStationType, label: '+6 Water', icon: Droplet, color: 'text-[#06B6D4]' },
              { type: 'medicine' as SupplyStationType, label: '+3 Med', icon: HeartPulse, color: 'text-[#10B981]' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    const amount = s.type === 'food' ? 4 : s.type === 'water' ? 6 : s.type === 'medicine' ? 3 : 0;
                    onUpdateCell({ supplyType: s.type, supplyAmount: amount });
                  }}
                  className={`p-2 rounded-md border text-center flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    cell.supplyType === s.type
                      ? 'bg-[#292929] border-[#F59E0B] text-[#FAFAFA] font-medium'
                      : 'bg-[#202020] border-[#292929] text-[#A0A0A0] hover:text-[#FAFAFA]'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${s.color}`} />}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#292929] flex justify-end">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#090909] font-bold transition-colors cursor-pointer"
          >
            Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
};
