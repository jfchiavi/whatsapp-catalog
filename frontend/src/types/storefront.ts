export type TenantIndustry = 'construction' | 'electronics' | 'beauty' | 'fashion' | 'home' | 'food' | 'sports' | 'pets' | 'other';

interface TenantHomeSectionBase {
  id: string;
  enabled: boolean;
}

export interface TenantHeroSection extends TenantHomeSectionBase {
  type: 'hero';
  title: string;
  description: string;
  imageUrl: string | null;
  ctaLabel: string;
}

export interface TenantCategoriesSection extends TenantHomeSectionBase {
  type: 'categories';
  title: string;
  items: { label: string; attributeKey: string; attributeValue: string }[];
}

export interface TenantFeaturedProductsSection extends TenantHomeSectionBase {
  type: 'featuredProducts';
  title: string;
  productIds: string[];
}

export interface TenantPromotionSection extends TenantHomeSectionBase {
  type: 'promotion';
  title: string;
  description: string;
  imageUrl: string | null;
  ctaLabel: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface TenantBenefitsSection extends TenantHomeSectionBase {
  type: 'benefits';
  title: string;
  items: { title: string; description: string }[];
}

export interface TenantContactSection extends TenantHomeSectionBase {
  type: 'contact';
  title: string;
  address: string;
  hours: string;
  phone: string;
  email: string;
}

export type TenantHomeSectionType = TenantHomeSection['type'];

export type TenantHomeSection =
  | TenantHeroSection
  | TenantCategoriesSection
  | TenantFeaturedProductsSection
  | TenantPromotionSection
  | TenantBenefitsSection
  | TenantContactSection;

export interface TenantHomeContent {
  version: 2;
  industry: TenantIndustry;
  sections: TenantHomeSection[];
}

export interface TenantHomePublicationSummary {
  id: string;
  revision: number;
  publishedAt: string;
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
  revision: number;
  hasPublishedContent: boolean;
}