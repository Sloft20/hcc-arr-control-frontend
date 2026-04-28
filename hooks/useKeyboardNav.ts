"use client";

// ============================================================
//  hooks/useKeyboardNav.ts — Atalhos de teclado para o painel
//
//  Mapeamento do Numpad:
//  Numpad 8 / ArrowUp    → item anterior na lista de alertas
//  Numpad 2 / ArrowDown  → próximo item na lista de alertas
//  Numpad 5 / Enter      → foca / expande o item selecionado
//  Numpad 0              → volta ao topo (primeiro alerta)
//  F5                    → refetch manual dos dados
// ============================================================

import { useEffect, useCallback } from "react";

interface UseKeyboardNavProps {
  totalItems: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onRefetch: () => void;
}

export function useKeyboardNav({
  totalItems,
  selectedIndex,
  onSelectIndex,
  onRefetch,
}: UseKeyboardNavProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Não interfere com inputs de formulário
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      switch (e.code) {
        case "Numpad8":
        case "ArrowUp":
          e.preventDefault();
          onSelectIndex(Math.max(0, selectedIndex - 1));
          break;

        case "Numpad2":
        case "ArrowDown":
          e.preventDefault();
          onSelectIndex(Math.min(totalItems - 1, selectedIndex + 1));
          break;

        case "Numpad0":
        case "Home":
          e.preventDefault();
          onSelectIndex(0);
          break;

        case "End":
          e.preventDefault();
          onSelectIndex(Math.max(0, totalItems - 1));
          break;

        case "F5":
          e.preventDefault();
          onRefetch();
          break;

        default:
          break;
      }
    },
    [totalItems, selectedIndex, onSelectIndex, onRefetch]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
