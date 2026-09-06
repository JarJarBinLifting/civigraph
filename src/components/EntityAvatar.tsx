'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { Entity } from '@/lib/types';
import { initials, typeInfo } from '@/lib/presentation';

export function EntityAvatar({ entity, className = 'mini-avatar', decorative = true }: { entity: Entity; className?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState('');
  const picture = entity.image && entity.image.src !== failed ? entity.image : null;
  return <span className={`${className} entity-avatar ${entity.type === 'person' ? 'portrait' : 'institution-picture'}`} style={{ background: typeInfo[entity.type].soft, color: typeInfo[entity.type].color }} aria-hidden={decorative || undefined}>
    {picture ? <Image unoptimized src={picture.src} width={picture.width} height={picture.height} alt={decorative ? '' : `${entity.type === 'person' ? 'Portrait' : 'Image'} de ${entity.label}`} onError={() => setFailed(picture.src)} /> : initials(entity.label)}
  </span>;
}
