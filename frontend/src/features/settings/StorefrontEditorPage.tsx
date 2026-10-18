import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Globe, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import {
  usePublishTenantHomeDraft,
  useRestoreTenantHomePublication,
  useSaveTenantHomeDraft,
  useTenantHomeDraft,
  useTenantHomePublicationHistory,
} from '@/hooks/useStorefront';
import { TenantHomeSections } from '@/components/tenant/TenantHomeSections';
import type {
  TenantHomeContent,
  TenantHomeSection,
  TenantIndustry,
  TenantHomeSectionType,
} from '@/types/storefront';

const INDUSTRIES: { value: TenantIndustry; label: string }[] = [
  { value: 'construction', label: 'Construcción y hogar' },
  { value: 'electronics', label: 'Electrónica' },
  { value: 'beauty', label: 'Belleza' },
  { value: 'fashion', label: 'Moda y accesorios' },
  { value: 'home', label: 'Hogar y decoración' },
  { value: 'food', label: 'Alimentos y bebidas' },
  { value: 'sports', label: 'Deportes' },
  { value: 'pets', label: 'Mascotas' },
  { value: 'other', label: 'Otro rubro' },
];

const SECTION_LABELS: Record<TenantHomeSectionType, string> = {
  hero: 'Hero',
  categories: 'Categorías',
  featuredProducts: 'Productos destacados',
  promotion: 'Promoción',
  benefits: 'Beneficios',
  contact: 'Contacto',
};

const createSection = (type: TenantHomeSectionType): TenantHomeSection => {
  const id = `${type}-${crypto.randomUUID()}`;
  switch (type) {
    case 'hero': return { id, type, enabled: true, title: 'Título principal', description: '', imageUrl: null, ctaLabel: 'Ver catálogo' };
    case 'categories': return { id, type, enabled: true, title: 'Explorar por categoría', items: [] };
    case 'featuredProducts': return { id, type, enabled: true, title: 'Productos destacados', productIds: [] };
    case 'promotion': return { id, type, enabled: true, title: 'Promoción especial', description: '', imageUrl: null, ctaLabel: 'Ver promoción', startsAt: null, endsAt: null };
    case 'benefits': return { id, type, enabled: true, title: 'Por qué elegirnos', items: [] };
    case 'contact': return { id, type, enabled: true, title: 'Visitanos o escribinos', address: '', hours: '', phone: '', email: '' };
  }
};

export default function StorefrontEditorPage() {
  const { role } = useAuth();
  const { data, isLoading, error } = useTenantHomeDraft();

  if (role !== 'ADMIN') return <p className="p-6 text-sm text-red-700">No tenés permiso para administrar esta portada.</p>;
  if (isLoading) return <p className="p-6 text-sm text-gray-500">Cargando configuración de portada...</p>;
  if (error || !data) return <p className="p-6 text-sm text-red-700">No se pudo cargar la configuración de la portada.</p>;

  return <StorefrontEditorForm key={data.tenant.id} data={data} />;
}

function StorefrontEditorForm({ data }: { data: NonNullable<ReturnType<typeof useTenantHomeDraft>['data']> }) {
  const saveDraft = useSaveTenantHomeDraft();
  const publishDraft = usePublishTenantHomeDraft();
  const restorePublication = useRestoreTenantHomePublication();
  const { data: products = [] } = useProducts();
  const { data: history = [] } = useTenantHomePublicationHistory();
  const [content, setContent] = useState<TenantHomeContent>(data.draftContent);
  const [previewVisible, setPreviewVisible] = useState(false);
  const activeProducts = products.filter((product) => product.active);
  const attributeFacets = new Map<string, Set<string>>();
  activeProducts.forEach((product) => {
    Object.entries(product.baseAttributes ?? {}).forEach(([key, value]) => {
      if (typeof value !== 'string' && typeof value !== 'number') return;
      const normalizedValue = String(value).trim();
      if (!normalizedValue) return;
      const values = attributeFacets.get(key) ?? new Set<string>();
      values.add(normalizedValue);
      attributeFacets.set(key, values);
    });
  });

  const updateSection = (sectionId: string, update: (section: TenantHomeSection) => TenantHomeSection) => {
    setContent((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? update(section) : section),
    }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= content.sections.length) return;
    const sections = [...content.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setContent({ ...content, sections });
  };

  const handlePublish = async () => {
    await saveDraft.mutateAsync(content);
    await publishDraft.mutateAsync();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">{data.tenant.name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Portada de la tienda</h1>
          <p className="mt-2 text-sm text-gray-600">Ordená las secciones. Los visitantes solo ven la última publicación.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPreviewVisible((visible) => !visible)} className="inline-flex min-h-10 items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800">
            <Eye size={16} aria-hidden="true" />{previewVisible ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
          <button type="button" onClick={() => saveDraft.mutate(content)} disabled={saveDraft.isPending || publishDraft.isPending} className="inline-flex min-h-10 items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 disabled:opacity-50">
            <Save size={16} aria-hidden="true" />Guardar borrador
          </button>
          <button type="button" onClick={handlePublish} disabled={saveDraft.isPending || publishDraft.isPending} className="inline-flex min-h-10 items-center gap-2 bg-gray-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Globe size={16} aria-hidden="true" />Publicar
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="max-w-sm">
            <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-gray-800">Rubro</label>
            <select id="industry" value={content.industry} onChange={(event) => setContent({ ...content, industry: event.target.value as TenantIndustry })} className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm">
              {INDUSTRIES.map((industry) => <option key={industry.value} value={industry.value}>{industry.label}</option>)}
            </select>
          </div>

          {content.sections.map((section, index) => (
            <section key={section.id} className="border border-gray-200 bg-white">
              <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
                <h2 className="mr-auto text-sm font-semibold text-gray-900">{SECTION_LABELS[section.type]}</h2>
                <button type="button" aria-label="Mover sección arriba" title="Mover arriba" disabled={index === 0} onClick={() => moveSection(index, -1)} className="p-1.5 text-gray-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                <button type="button" aria-label="Mover sección abajo" title="Mover abajo" disabled={index === content.sections.length - 1} onClick={() => moveSection(index, 1)} className="p-1.5 text-gray-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={section.enabled} onChange={(event) => updateSection(section.id, (current) => ({ ...current, enabled: event.target.checked }))} />
                  Visible
                </label>
                <button type="button" aria-label="Eliminar sección" title="Eliminar sección" onClick={() => setContent({ ...content, sections: content.sections.filter((item) => item.id !== section.id) })} className="p-1.5 text-gray-500 hover:text-red-700"><Trash2 size={16} /></button>
              </header>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {'title' in section && <Field label="Título" value={section.title} onChange={(value) => updateSection(section.id, (current) => ({ ...current, title: value } as TenantHomeSection))} />}
                {section.type === 'hero' && <>
                  <Field label="Texto" value={section.description} multiline onChange={(value) => updateSection(section.id, (current) => current.type === 'hero' ? { ...current, description: value } : current)} />
                  <Field label="URL de imagen" value={section.imageUrl ?? ''} onChange={(value) => updateSection(section.id, (current) => current.type === 'hero' ? { ...current, imageUrl: value || null } : current)} />
                  <Field label="Texto CTA" value={section.ctaLabel} onChange={(value) => updateSection(section.id, (current) => current.type === 'hero' ? { ...current, ctaLabel: value } : current)} />
                </>}
                {section.type === 'categories' && <div className="sm:col-span-2 space-y-3">
                  <p className="text-xs text-gray-500">Los enlaces usan valores disponibles en atributos de productos activos.</p>
                  {section.items.map((item, itemIndex) => <div key={`${item.attributeKey}-${itemIndex}`} className="grid gap-2 sm:grid-cols-3">
                    <Field label="Etiqueta" value={item.label} onChange={(label) => updateSection(section.id, (current) => current.type === 'categories' ? { ...current, items: current.items.map((value, i) => i === itemIndex ? { ...value, label } : value) } : current)} />
                    <label className="block text-sm text-gray-700"><span className="mb-1 block text-xs font-medium">Atributo</span><select value={item.attributeKey} onChange={(event) => updateSection(section.id, (current) => current.type === 'categories' ? { ...current, items: current.items.map((value, i) => i === itemIndex ? { ...value, attributeKey: event.target.value, attributeValue: '' } : value) } : current)} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Elegí atributo</option>{[...attributeFacets.keys()].sort().map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
                    <div className="flex items-end gap-2"><label className="block min-w-0 flex-1 text-sm text-gray-700"><span className="mb-1 block text-xs font-medium">Valor</span><select value={item.attributeValue} onChange={(event) => updateSection(section.id, (current) => current.type === 'categories' ? { ...current, items: current.items.map((value, i) => i === itemIndex ? { ...value, attributeValue: event.target.value } : value) } : current)} className="w-full border border-gray-300 bg-white px-3 py-2 text-sm" disabled={!item.attributeKey}><option value="">Elegí valor</option>{[...(attributeFacets.get(item.attributeKey) ?? [])].sort().map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" aria-label="Eliminar enlace" title="Eliminar enlace" onClick={() => updateSection(section.id, (current) => current.type === 'categories' ? { ...current, items: current.items.filter((_, i) => i !== itemIndex) } : current)} className="mb-1 p-2 text-gray-500 hover:text-red-700"><Trash2 size={15} /></button></div>
                  </div>)}
                  <button type="button" onClick={() => updateSection(section.id, (current) => current.type === 'categories' ? { ...current, items: [...current.items, { label: '', attributeKey: '', attributeValue: '' }] } : current)} className="text-sm font-medium text-gray-800 underline">Agregar enlace de categoría</button>
                </div>}
                {section.type === 'featuredProducts' && <div className="sm:col-span-2">
                  <p className="mb-2 text-xs text-gray-500">Solo se guardan productos activos de esta tienda.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeProducts.map((product) => <label key={product.id} className="flex items-start gap-2 border-b border-gray-100 py-2 text-sm text-gray-800">
                      <input type="checkbox" checked={section.productIds.includes(product.id)} onChange={(event) => updateSection(section.id, (current) => current.type === 'featuredProducts' ? { ...current, productIds: event.target.checked ? [...new Set([...current.productIds, product.id])] : current.productIds.filter((id) => id !== product.id) } : current)} />
                      <span>{product.name}</span>
                    </label>)}
                  </div>
                </div>}
                {section.type === 'promotion' && <>
                  <Field label="Descripción" value={section.description} multiline onChange={(value) => updateSection(section.id, (current) => current.type === 'promotion' ? { ...current, description: value } : current)} />
                  <Field label="URL de imagen" value={section.imageUrl ?? ''} onChange={(value) => updateSection(section.id, (current) => current.type === 'promotion' ? { ...current, imageUrl: value || null } : current)} />
                  <Field label="Texto CTA" value={section.ctaLabel} onChange={(value) => updateSection(section.id, (current) => current.type === 'promotion' ? { ...current, ctaLabel: value } : current)} />
                  <DateField label="Desde" value={section.startsAt} onChange={(value) => updateSection(section.id, (current) => current.type === 'promotion' ? { ...current, startsAt: value } : current)} />
                  <DateField label="Hasta" value={section.endsAt} onChange={(value) => updateSection(section.id, (current) => current.type === 'promotion' ? { ...current, endsAt: value } : current)} />
                </>}
                {section.type === 'benefits' && <div className="sm:col-span-2 space-y-3">
                  {section.items.map((item, itemIndex) => <div key={itemIndex} className="grid gap-2 sm:grid-cols-2">
                    <Field label="Beneficio" value={item.title} onChange={(title) => updateSection(section.id, (current) => current.type === 'benefits' ? { ...current, items: current.items.map((value, i) => i === itemIndex ? { ...value, title } : value) } : current)} />
                    <Field label="Descripción" value={item.description} onChange={(description) => updateSection(section.id, (current) => current.type === 'benefits' ? { ...current, items: current.items.map((value, i) => i === itemIndex ? { ...value, description } : value) } : current)} />
                  </div>)}
                  <button type="button" onClick={() => updateSection(section.id, (current) => current.type === 'benefits' ? { ...current, items: [...current.items, { title: '', description: '' }] } : current)} className="text-sm font-medium text-gray-800 underline">Agregar beneficio</button>
                </div>}
                {section.type === 'contact' && <>
                  <Field label="Dirección" value={section.address} onChange={(value) => updateSection(section.id, (current) => current.type === 'contact' ? { ...current, address: value } : current)} />
                  <Field label="Horarios" value={section.hours} onChange={(value) => updateSection(section.id, (current) => current.type === 'contact' ? { ...current, hours: value } : current)} />
                  <Field label="Teléfono" value={section.phone} onChange={(value) => updateSection(section.id, (current) => current.type === 'contact' ? { ...current, phone: value } : current)} />
                  <Field label="Email" value={section.email} onChange={(value) => updateSection(section.id, (current) => current.type === 'contact' ? { ...current, email: value } : current)} />
                </>}
              </div>
            </section>
          ))}

          <AddSection onAdd={(type) => setContent({ ...content, sections: [...content.sections, createSection(type)] })} />
        </div>

        <aside className="h-fit space-y-5 border-t border-gray-200 pt-5 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
          <section>
            <h2 className="text-sm font-semibold text-gray-900">Publicación</h2>
            <p className="mt-2 text-sm text-gray-600">{data.hasPublishedContent ? `Revisión ${data.revision} · ${data.publishedAt ? new Date(data.publishedAt).toLocaleString('es-AR') : ''}` : 'Todavía no hay una versión publicada.'}</p>
            {saveDraft.isSuccess && <p className="mt-2 text-sm text-emerald-700">Borrador guardado.</p>}
            {publishDraft.isSuccess && <p className="mt-2 text-sm text-emerald-700">Portada publicada.</p>}
            {(saveDraft.error || publishDraft.error || restorePublication.error) && <p className="mt-2 text-sm text-red-700">No se pudo completar la acción. Revisá los datos e intentá nuevamente.</p>}
          </section>
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">Historial de publicaciones</h2>
            {history.length === 0 ? <p className="mt-2 text-sm text-gray-500">Todavía no hay versiones publicadas.</p> : <ul className="mt-3 space-y-3">{history.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-600">Revisión {entry.revision}<br />{new Date(entry.publishedAt).toLocaleString('es-AR')}</span>
              <button type="button" onClick={() => restorePublication.mutate(entry.revision)} disabled={restorePublication.isPending} className="text-xs font-semibold text-gray-800 underline disabled:opacity-50">Restaurar borrador</button>
            </li>)}</ul>}
          </section>
        </aside>
      </div>

      {previewVisible && <Preview content={content} tenantName={data.tenant.name} slug={data.tenant.slug} products={activeProducts} />}
    </div>
  );
}

function AddSection({ onAdd }: { onAdd: (type: TenantHomeSectionType) => void }) {
  const [type, setType] = useState<TenantHomeSectionType>('categories');
  return <div className="flex flex-wrap gap-2 border border-dashed border-gray-300 p-4">
    <select value={type} onChange={(event) => setType(event.target.value as TenantHomeSectionType)} className="min-h-10 border border-gray-300 bg-white px-3 text-sm">
      {Object.entries(SECTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <button type="button" onClick={() => onAdd(type)} className="inline-flex min-h-10 items-center gap-2 bg-gray-950 px-3 text-sm font-semibold text-white"><Plus size={16} />Agregar sección</button>
  </div>;
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="block text-sm text-gray-700">
    <span className="mb-1 block text-xs font-medium">{label}</span>
    {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full border border-gray-300 px-3 py-2 text-sm" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm" />}
  </label>;
}

function DateField({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  return <label className="block text-sm text-gray-700">
    <span className="mb-1 block text-xs font-medium">{label}</span>
    <input type="datetime-local" value={value ? value.slice(0, 16) : ''} onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)} className="w-full border border-gray-300 px-3 py-2 text-sm" />
  </label>;
}

function Preview({ content, tenantName, slug, products }: { content: TenantHomeContent; tenantName: string; slug: string; products: NonNullable<ReturnType<typeof useProducts>['data']> }) {
  return <section className="border border-gray-300 bg-white" aria-label="Vista previa de portada">
    <div className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase text-gray-500">Vista previa del borrador</div>
    <TenantHomeSections
      sections={content.sections}
      tenantName={tenantName}
      tenantSlug={slug}
      products={products}
    />
  </section>;
}
