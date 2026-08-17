'use client';

import React from 'react';
import {
  Zap,
  Sparkles,
  GitBranch,
  FileText,
  ShieldCheck,
  Globe,
  Clock,
  Terminal,
  Bot,
  Activity,
} from 'lucide-react';
import { NodeType } from '@repo/shared-types';

export function getNodeTypeIcon(type: NodeType, className: string = 'w-4 h-4') {
  switch (type) {
    case 'trigger':
      return <Zap className={`${className} text-[#2E8FA3]`} />;
    case 'llm':
      return <Sparkles className={`${className} text-[#2E8FA3]`} />;
    case 'condition':
      return <GitBranch className={`${className} text-[#2E8FA3]`} />;
    case 'action':
      return <Terminal className={`${className} text-[#2E8FA3]`} />;
    case 'approval':
      return <ShieldCheck className={`${className} text-[#EF9F27]`} />;
    default:
      return <Activity className={`${className} text-[#A8ACAE]`} />;
  }
}

export function getNodePaletteIcon(label: string, className: string = 'w-4 h-4') {
  if (label.includes('Webhook')) return <Zap className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('Cron') || label.includes('Schedule')) return <Clock className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('Gemini') || label.includes('LLM')) return <Sparkles className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('Condition') || label.includes('Logic')) return <GitBranch className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('HTTP')) return <Globe className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('Logger') || label.includes('Log')) return <FileText className={`${className} text-[#2E8FA3]`} />;
  if (label.includes('Approval')) return <ShieldCheck className={`${className} text-[#EF9F27]`} />;
  return <Bot className={`${className} text-[#A8ACAE]`} />;
}
