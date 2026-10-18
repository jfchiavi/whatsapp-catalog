import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { TenantHomeContent } from '@/types/storefront';

interface TenantHeroProps {
  content: TenantHomeContent['hero'];
  tenantName: string;
  catalogPath: string;
}

export function TenantHero({ content, tenantName, catalogPath }: TenantHeroProps) {
  return (
    <section className="border-b border-gray-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase text-gray-500">{tenantName}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-gray-950 sm:text-5xl">
            {content.title}
          </h1>
          {content.description && (
            <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">{content.description}</p>
          )}
          <Link
            to={catalogPath}
            className="mt-7 inline-flex min-h-12 items-center gap-3 bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            {content.ctaLabel}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="relative min-h-64 overflow-hidden bg-gray-200 sm:min-h-80 lg:min-h-96">
          {content.imageUrl ? (
            <img src={content.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#e5e7eb_0%,#f8fafc_48%,#d1d5db_100%)]" />
          )}
        </div>
      </div>
    </section>
  );
}