import {
  FileCode, Coffee, Code, Palette, Database, Network, Monitor, Workflow,
  Cpu, CircuitBoard, Globe, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  FileCode,
  Coffee,
  Code,
  Palette,
  Database,
  Network,
  Monitor,
  Workflow,
  Cpu,
  CircuitBoard,
  Globe,
};

export function getIconByName(name: string): LucideIcon {
  return iconMap[name] ?? FileCode;
}
