/**
 * PremiumDockIcons.tsx
 *
 * Uses Phosphor Icons (phosphor-react-native) — a premium, production-grade
 * icon library used by Linear, Vercel, and top-tier apps.
 *
 * Every Phosphor icon ships with both `regular` (outline) and `fill` weights
 * built-in, so filled/unfilled states are handled by the library itself.
 *
 * Mosque uses MaterialCommunityIcons since Phosphor doesn't have a mosque glyph.
 */
import React from 'react';
import {
  House,
  BookOpen,
  PaperPlaneTilt,
  UserCircle,
} from 'phosphor-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color: string;
  filled?: boolean;
}

// ── Home ──────────────────────────────────────────────────────────────────────
export function HomeIcon({ size = 24, color, filled = false }: IconProps) {
  return (
    <House
      size={size}
      color={color}
      weight={filled ? 'fill' : 'regular'}
    />
  );
}

// ── Quran / Open Book ─────────────────────────────────────────────────────────
export function QuranIcon({ size = 24, color, filled = false }: IconProps) {
  return (
    <BookOpen
      size={size}
      color={color}
      weight={filled ? 'fill' : 'regular'}
    />
  );
}

// ── Mosque ────────────────────────────────────────────────────────────────────
// Phosphor doesn't include a mosque icon, so we use MaterialCommunityIcons
// which has an authentic, well-drawn mosque glyph.
export function MosqueIcon({ size = 24, color, filled = false }: IconProps) {
  return (
    <MaterialCommunityIcons
      name={filled ? 'mosque' : 'mosque-outline'}
      size={size}
      color={color}
    />
  );
}

// ── Circles / DM ─────────────────────────────────────────────────────────────
// PaperPlaneTilt is Phosphor's premium send/DM icon — identical feel to
// Instagram's DM icon.
export function CirclesIcon({ size = 24, color, filled = false }: IconProps) {
  return (
    <PaperPlaneTilt
      size={size}
      color={color}
      weight={filled ? 'fill' : 'regular'}
    />
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function ProfileIcon({ size = 24, color, filled = false }: IconProps) {
  return (
    <UserCircle
      size={size}
      color={color}
      weight={filled ? 'fill' : 'regular'}
    />
  );
}
