export type TenantIndustry = 'construction' | 'electronics' | 'beauty' | 'fashion' | 'other';

export interface TenantHomeContent {
  version: 1;
  industry: TenantIndustry;
  hero: {
    title: string;
    description: string;
    imageUrl: string | null;
    ctaLabel: string;
  };
}

export interface TenantHomeDraftResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    description: string | null;
    whatsappNumber: string | null;
  };
  draftContent: TenantHomeContent;
  publishedAt: string | null;
  hasPublishedContent: boolean;
}