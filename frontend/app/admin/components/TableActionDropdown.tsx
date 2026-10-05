'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface TableActionDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  buttonLabel?: string;
  buttonVariant?: 'primary' | 'secondary';
  buttonTitle?: string;
  buttonClassName?: string;
  menuWidth?: number;
}

export function TableActionDropdown({
  isOpen,
  onToggle,
  onClose,
  children,
  buttonLabel = 'Acciones',
  buttonVariant = 'primary',
  buttonTitle = 'Acciones disponibles',
  buttonClassName = '',
  menuWidth = 230,
}: TableActionDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    right?: number;
    isUp?: boolean;
    maxHeight?: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateCoords = () => {
    if (!buttonRef.current || typeof window === 'undefined') return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Menu standard height with 8 actions is ~360-380px.
    // If space below is not enough (< 380px) and space above is larger, or space below is very tight (< 300px) and space above is at least 220px, flip UP.
    const openUp = (spaceBelow < 380 && spaceAbove > spaceBelow) || (spaceBelow < 300 && spaceAbove >= 220);

    const padding = 12;
    let right = window.innerWidth - rect.right;
    if (right < padding) {
      right = padding;
    }
    if (window.innerWidth - right - menuWidth < padding) {
      right = Math.max(padding, window.innerWidth - menuWidth - padding);
    }

    const availableHeight = openUp ? spaceAbove - 20 : spaceBelow - 20;
    const maxHeight = Math.max(180, Math.min(availableHeight, 520));

    return {
      top: openUp ? undefined : Math.round(rect.bottom + 6),
      bottom: openUp ? Math.round(window.innerHeight - rect.top + 6) : undefined,
      right: Math.round(right),
      isUp: openUp,
      maxHeight: Math.round(maxHeight),
    };
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      const coords = calculateCoords();
      setMenuCoords(coords);
    }
    onToggle();
  };

  useEffect(() => {
    if (!isOpen) {
      setMenuCoords(null);
      return;
    }

    if (!menuCoords) {
      setMenuCoords(calculateCoords());
    }

    // Dismiss on outside scroll, window resize, or Escape key
    const handleScroll = (e: Event) => {
      // Do NOT dismiss if the user is scrolling inside the floating menu itself
      if (menuRef.current && e.target && (e.target === menuRef.current || menuRef.current.contains(e.target as Node))) {
        return;
      }
      onClose();
    };

    const handleResize = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const activeCoords = menuCoords || calculateCoords();

  const btnClass =
    buttonVariant === 'secondary'
      ? 'btn-meta-action btn-meta-action-secondary'
      : 'btn-meta-action btn-meta-action-primary';

  return (
    <div className="table-action-floating-container" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`${btnClass} shadow-xs ${buttonClassName}`}
        title={buttonTitle}
        aria-expanded={isOpen}
      >
        <span>{buttonLabel}</span>
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {isOpen && mounted && typeof document !== 'undefined' && activeCoords && createPortal(
        <>
          {/* Backdrop invisible to catch outside clicks and dismiss */}
          <div
            className="table-action-portal-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999980,
              background: 'transparent',
              cursor: 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onClose();
            }}
          />

          {/* Floating Action Menu rendered directly into document.body */}
          <div
            ref={menuRef}
            className={`table-action-menu shadow-xl ${activeCoords.isUp ? 'table-action-menu-up' : ''}`}
            style={{
              position: 'fixed',
              top: activeCoords.top !== undefined ? `${activeCoords.top}px` : 'auto',
              bottom: activeCoords.bottom !== undefined ? `${activeCoords.bottom}px` : 'auto',
              right: activeCoords.right !== undefined ? `${activeCoords.right}px` : '12px',
              left: 'auto',
              minWidth: `${menuWidth}px`,
              width: 'max-content',
              maxWidth: 'min(300px, calc(100vw - 24px))',
              maxHeight: `${activeCoords.maxHeight || 440}px`,
              overflowY: 'auto',
              overflowX: 'hidden',
              zIndex: 999990,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
