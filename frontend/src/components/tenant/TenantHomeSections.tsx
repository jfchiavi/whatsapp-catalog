import { useEffect, useEffectEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@/types/product';
import type { TenantHomeContent } from '@/types/storefront';
import { TenantHero } from './TenantHero';
import { TenantProductCard } from './TenantProductCard';
import { recordStorefrontMetric } from '@/services/storefront.api';

interface TenantHomeSectionsProps {
  sections: TenantHomeContent['sections'];
  tenantName: string;
  tenantSlug?: string;
  metricTenantSlug?: string;
  whatsappNumber?: string | null;
  products: Product[];
  preview?: boolean;
}

export function TenantHomeSections({
  sections,
  tenantName,
  tenantSlug,
  metricTenantSlug,
  whatsappNumber,
  products,
}: TenantHomeSectionsProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const updateCurrentTime = useEffectEvent(() => setCurrentTime(Date.now()));
  const catalogPath = tenantSlug ? `/t/${tenantSlug}/catalogo` : '/catalogo';

  useEffect(() => {
    updateCurrentTime();
    const timerId = window.setInterval(updateCurrentTime, 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  return <>
    {sections.filter((section) => section.enabled).map((section) => {
      if (section.type === 'hero') {
        return <TenantHero key={section.id} content={section} tenantName={tenantName} catalogPath={catalogPath} onCatalogClick={() => metricTenantSlug && void recordStorefrontMetric(metricTenantSlug, 'CATALOG_CLICK')} />;
      }

      if (section.type === 'categories') {
        return (
          <section key={section.id} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-gray-950">{section.title}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {section.items.map((item) => (
                <Link
                  key={`${item.attributeKey}-${item.attributeValue}`}
                  to={`${catalogPath}?${new URLSearchParams({ attributeKey: item.attributeKey, attributeValue: item.attributeValue })}`}
                  onClick={() => metricTenantSlug && void recordStorefrontMetric(metricTenantSlug, 'CATEGORY_CLICK', item.label)}
                  className="border-b-2 border-gray-300 px-1 py-3 text-base font-medium text-gray-800 hover:border-gray-950 hover:text-gray-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        );
      }

      if (section.type === 'featuredProducts') {
        const featured = section.productIds
          .map((id) => products.find((product) => product.id === id))
          .filter((product): product is Product => product !== undefined && product.active);
        if (!featured.length) return null;
        return (
          <section key={section.id} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-semibold text-gray-950">{section.title}</h2>
              <Link to={catalogPath} className="text-sm font-semibold text-gray-700 hover:text-gray-950">Ver catálogo</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => <TenantProductCard key={product.id} product={product} tenantSlug={tenantSlug} onProductClick={(productId) => metricTenantSlug && void recordStorefrontMetric(metricTenantSlug, 'FEATURED_PRODUCT_CLICK', productId)} />)}
            </div>
          </section>
        );
      }

      if (section.type === 'promotion') {
        if (currentTime > 0 && section.startsAt && Date.parse(section.startsAt) > currentTime) return null;
        if (currentTime > 0 && section.endsAt && Date.parse(section.endsAt) <= currentTime) return null;
        return (
          <section key={section.id} className="bg-amber-50">
            <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-800">Promoción</p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-950">{section.title}</h2>
                <p className="mt-3 max-w-2xl text-gray-700">{section.description}</p>
                <Link to={catalogPath} onClick={() => metricTenantSlug && void recordStorefrontMetric(metricTenantSlug, 'CATALOG_CLICK')} className="mt-5 inline-flex border-b border-gray-900 pb-1 text-sm font-semibold text-gray-950">{section.ctaLabel}</Link>
              </div>
              {section.imageUrl && <img src={section.imageUrl} alt="" className="max-h-80 w-full object-cover" />}
            </div>
          </section>
        );
      }

      if (section.type === 'benefits') {
        return (
          <section key={section.id} className="border-y border-gray-200 bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold text-gray-950">{section.title}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {section.items.map((benefit) => (
                  <div key={benefit.title} className="border-l-2 border-emerald-600 pl-4">
                    <h3 className="font-semibold text-gray-950">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      return (
        <section key={section.id} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-950">{section.title}</h2>
          <address className="mt-4 grid gap-2 text-sm not-italic text-gray-700 sm:grid-cols-2">
            {section.address && <span>{section.address}</span>}
            {section.hours && <span>{section.hours}</span>}
            {section.phone && <a href={`tel:${section.phone}`} className="hover:underline">{section.phone}</a>}
            {section.email && <a href={`mailto:${section.email}`} className="hover:underline">{section.email}</a>}
            {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} onClick={() => metricTenantSlug && void recordStorefrontMetric(metricTenantSlug, 'WHATSAPP_CLICK')} className="hover:underline">WhatsApp: {whatsappNumber}</a>}
          </address>
        </section>
      );
    })}
  </>;
}
