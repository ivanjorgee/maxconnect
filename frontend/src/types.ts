export type LeadChannel = "INSTAGRAM" | "WHATSAPP" | "OUTRO";

export type LeadStatus = "MANDADO" | "VISUALIZOU" | "RESPONDEU" | "NEGOCIANDO" | "FECHADO";

export interface Lead {
  id: number;
  name: string;
  contact: string;
  channel: LeadChannel;
  status: LeadStatus;
  city?: string | null;
  niche?: string | null;
  notes?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  mapUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
