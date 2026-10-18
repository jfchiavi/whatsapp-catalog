import { useState } from 'react';
import { Eye, Globe, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePublishTenantHomeDraft, useSaveTenantHomeDraft, useTenantHomeDraft } from '@/hooks/useStorefront';
import { TenantHero } from '@/components/tenant/TenantHero';
import type { TenantHomeContent, TenantIndustry } from '@/types/storefront';

const INDUSTRIES: { value: TenantIndustry; label: string }[] = [
  { value: 'construction', label: 'Construcción y hogar' },
  { value: 'electronics', label: 'Electrónica' },
  { value: 'beauty', label: 'Belleza' },
  { value: 'fashion', label: 'Moda y accesorios' },
  { value: 'other', label: 'Otro rubro' },
];

export default function StorefrontEditorPage() {
  const { role } = useAuth();
  const { data, isLoading, error } = useTenantHomeDraft();

  if (role !== 'ADMIN') {
    return <p className="p-6 text-sm text-red-700">No tenés permiso para administrar esta portada.</p>;
  }

  if (isLoading) return <p className="p-6 text-sm text-gray-500">Cargando configuración de portada...</p>;
  if (error || !data) {
    return <p className="p-6 text-sm text-red-700">No se pudo cargar la configuración de la portada.</p>;
  }

  return <StorefrontEditorForm key={data.tenant.id} data={data} />;
}

function StorefrontEditorForm({ data }: { data: NonNullable<ReturnType<typeof useTenantHomeDraft>['data']> }) {
  const saveDraft = useSaveTenantHomeDraft();
  const publishDraft = usePublishTenantHomeDraft();
  const [content, setContent] = useState<TenantHomeContent>(data.draftContent);
  const [previewVisible, setPreviewVisible] = useState(false);

  const updateHero = (field: keyof TenantHomeContent['hero'], value: string) => {
    setContent((current) => current && ({
      ...current,
      hero: { ...current.hero, [field]: field === 'imageUrl' ? value || null : value },
    }));
  };

  const handleSave = () => saveDraft.mutate(content);
  const handlePublish = async () => {
    if (saveDraft.isPending || publishDraft.isPending) return;
    await saveDraft.mutateAsync(content);
    publishDraft.mutate();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">{data.tenant.name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Portada de la tienda</h1>
          <p className="mt-2 text-sm text-gray-600">Editá el borrador; los visitantes solo ven el contenido publicado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreviewVisible((visible) => !visible)}
            className="inline-flex min-h-10 items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:border-gray-900"
          >
            <Eye size={16} aria-hidden="true" />
            {previewVisible ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveDraft.isPending || publishDraft.isPending}
            className="inline-flex min-h-10 items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:border-gray-900 disabled:opacity-50"
          >
            <Save size={16} aria-hidden="true" />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saveDraft.isPending || publishDraft.isPending}
            className="inline-flex min-h-10 items-center gap-2 bg-gray-950 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Globe size={16} aria-hidden="true" />
            Publicar
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-gray-800">Rubro</label>
            <select
              id="industry"
              value={content.industry}
              onChange={(event) => setContent({ ...content, industry: event.target.value as TenantIndustry })}
              className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry.value} value={industry.value}>{industry.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hero-title" className="mb-1.5 block text-sm font-medium text-gray-800">Título principal</label>
            <input
              id="hero-title"
              value={content.hero.title}
              maxLength={100}
              onChange={(event) => updateHero('title', event.target.value)}
              className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="hero-description" className="mb-1.5 block text-sm font-medium text-gray-800">Texto de apoyo</label>
            <textarea
              id="hero-description"
              value={content.hero.description}
              maxLength={500}
              rows={4}
              onChange={(event) => updateHero('description', event.target.value)}
              className="w-full resize-y border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="hero-image" className="mb-1.5 block text-sm font-medium text-gray-800">URL de imagen</label>
            <input
              id="hero-image"
              type="url"
              value={content.hero.imageUrl ?? ''}
              placeholder="https://..."
              onChange={(event) => updateHero('imageUrl', event.target.value)}
              className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="hero-cta" className="mb-1.5 block text-sm font-medium text-gray-800">Texto del botón al catálogo</label>
            <input
              id="hero-cta"
              value={content.hero.ctaLabel}
              maxLength={40}
              onChange={(event) => updateHero('ctaLabel', event.target.value)}
              className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>

        <aside className="h-fit border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Estado de publicación</h2>
          <p className="mt-2 text-sm text-gray-600">
            {data.hasPublishedContent
              ? `Publicado ${data.publishedAt ? `el ${new Date(data.publishedAt).toLocaleString('es-AR')}` : ''}`
              : 'Todavía no hay una versión publicada.'}
          </p>
          {saveDraft.isSuccess && <p className="mt-3 text-sm text-emerald-700">Borrador guardado.</p>}
          {publishDraft.isSuccess && <p className="mt-3 text-sm text-emerald-700">Portada publicada.</p>}
          {(saveDraft.error || publishDraft.error) && (
            <p className="mt-3 text-sm text-red-700">No se pudo guardar el cambio. Revisá los campos e intentá nuevamente.</p>
          )}
        </aside>
      </section>

      {previewVisible && (
        <section className="border border-gray-200 bg-white" aria-label="Vista previa del hero">
          <div className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase text-gray-500">Vista previa del borrador</div>
          <TenantHero
            content={content.hero}
            tenantName={data.tenant.name}
            catalogPath={`/t/${data.tenant.slug}/catalogo`}
          />
        </section>
      )}
    </div>
  );
}