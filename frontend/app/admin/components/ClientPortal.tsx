'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ClientPortalProps {
  children: React.ReactNode;
  selector?: string;
}

export default function ClientPortal({ children, selector = 'body' }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const target = document.querySelector(selector) || document.body;
  return createPortal(children, target);
}
