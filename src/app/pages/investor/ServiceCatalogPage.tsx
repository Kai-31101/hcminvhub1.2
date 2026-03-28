import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileCheck,
  FileText,
  HardHat,
  Leaf,
  MapPin,
  Package,
  Send,
  Shield,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { services } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

const iconMap: Record<string, React.ReactNode> = {
  FileCheck: <FileCheck size={18} />,
  Building: <Building size={18} />,
  Leaf: <Leaf size={18} />,
  HardHat: <HardHat size={18} />,
  MapPin: <MapPin size={18} />,
  Package: <Package size={18} />,
  Shield: <Shield size={18} />,
  Users: <Users size={18} />,
};

const categories = ['All', 'Registration', 'Environment', 'Construction', 'Land', 'Trade', 'Safety', 'Labor'];

function categoryTone(category: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (category === 'Environment') return 'success';
  if (category === 'Construction' || category === 'Land') return 'warning';
  if (category === 'Safety') return 'danger';
  if (category === 'Registration' || category === 'Trade') return 'info';
  return 'default';
}

export default function ServiceCatalogPage() {
  const { projects, activeInvestorCompany, createServiceRequest, language } = useApp();
  const t = (value: string) => translateText(value, language);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [applyStep, setApplyStep] = useState<'detail' | 'form' | 'success'>('detail');
  const [projectId, setProjectId] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState('');

  const filteredServices = services.filter((service) => selectedCategory === 'All' || service.category === selectedCategory);

  function openService(service: (typeof services)[0]) {
    setSelectedService(service);
    setApplyStep('detail');
    setProjectId('');
    setUploadedDocs([]);
    setNotes('');
    setSubmittedRequestId('');
  }

  function closeModal() {
    setSelectedService(null);
    setApplyStep('detail');
    setProjectId('');
    setUploadedDocs([]);
    setNotes('');
    setSubmittedRequestId('');
  }

  function handleSubmitApplication() {
    if (!selectedService || !projectId) return;
    const selectedProject = projects.find((project) => project.id === projectId);
    if (!selectedProject) return;
    const requestId = createServiceRequest({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      applicant: activeInvestorCompany,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      assignedAgency: selectedService.agency,
      documents: uploadedDocs,
      notes: notes.trim(),
    });
    setSubmittedRequestId(requestId);
    setApplyStep('success');
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('B2G Service Catalog')}</h1>
        <p className="section-subheading">{t('Browse licensing, registration, and compliance services needed to move investor projects through execution.')}</p>
      </div>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Service Categories')}</h2>
          <StatusPill tone="info">{filteredServices.length} {t('available')}</StatusPill>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={[
                'rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                selectedCategory === category ? 'border-sky-700 bg-sky-700 text-white' : 'border-border bg-card text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {t(category)}
            </button>
          ))}
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Available Services')}</h2>
          <StatusPill tone="default">{t('Investor workflow')}</StatusPill>
        </div>
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <button key={service.id} type="button" onClick={() => openService(service)} className="block w-full text-left">
              <DataRow className="items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="rounded-lg bg-sky-50 p-2 text-sky-700">{iconMap[service.icon]}</div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{t(service.name)}</div>
                      <StatusPill tone={categoryTone(service.category)}>{t(service.category)}</StatusPill>
                    </div>
                    <div className="text-sm text-slate-600">{t(service.description)}</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>{t(service.agency)}</span>
                      <span>{service.requiredDocs.length} {t('required documents')}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 size={12} />
                    {t(service.processingTime)}
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <DollarSign size={12} />
                    {t(service.fee)}
                  </div>
                </div>
              </DataRow>
            </button>
          ))}
        </div>
      </section>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-border p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-sky-50 p-3 text-sky-700">{iconMap[selectedService.icon]}</div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-slate-900">{t(selectedService.name)}</div>
                    <StatusPill tone={categoryTone(selectedService.category)}>{t(selectedService.category)}</StatusPill>
                  </div>
                  <div className="text-sm text-slate-500">{t(selectedService.agency)}</div>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {applyStep === 'detail' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-slate-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Processing Time')}</div>
                      <div className="text-sm font-semibold text-slate-900">{t(selectedService.processingTime)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-slate-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Fee')}</div>
                      <div className="text-sm font-semibold text-slate-900">{t(selectedService.fee)}</div>
                    </div>
                  </div>
                  <div>
                    <h2 className="section-heading mb-2">{t('Service Description')}</h2>
                    <p className="section-subheading">{t(selectedService.description)}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Required Documents')}</div>
                    {selectedService.requiredDocs.map((documentName, index) => (
                      <DataRow key={documentName}>
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">{index + 1}</div>
                        <div className="flex-1 text-sm text-slate-700">{t(documentName)}</div>
                      </DataRow>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setApplyStep('form')} className="app-button">
                      {t('Apply for service')}
                    </button>
                  </div>
                </>
              )}

              {applyStep === 'form' && (
                <>
                  <div>
                    <h2 className="section-heading mb-1">{t('Service Application')}</h2>
                    <p className="section-subheading">{t('Attach the project and supporting documents before routing the request to the responsible agency.')}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Associated Project')}</span>
                      <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="app-input">
                        <option value="">{t('Select project')}</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>{t(project.name)}</option>
                        ))}
                      </select>
                    </label>
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Document Upload')}</span>
                      <div className="rounded-xl border-2 border-dashed border-border bg-slate-50 px-4 py-6 text-center">
                        <Upload size={20} className="mx-auto text-slate-400" />
                        <div className="mt-2 text-sm text-slate-600">{t('Upload required files or simulate the intake package.')}</div>
                        <button
                          type="button"
                          onClick={() => setUploadedDocs(selectedService.requiredDocs.map((_, index) => `Document_${index + 1}.pdf`))}
                          className="mt-3 app-button-secondary"
                        >
                          {t('Simulate upload')}
                        </button>
                      </div>
                    </div>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Additional Notes')}</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        className="app-input min-h-28"
                        placeholder={t('Add context for the processing agency, missing items, or delivery constraints')}
                      />
                    </label>
                  </div>
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Uploaded Files')}</div>
                      {uploadedDocs.map((documentName) => (
                        <DataRow key={documentName}>
                          <CheckCircle2 size={14} className="text-emerald-700" />
                          <div className="flex-1 text-sm text-slate-700">{t(documentName)}</div>
                        </DataRow>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between gap-3">
                    <button type="button" onClick={() => setApplyStep('detail')} className="app-button-secondary">
                      {t('Back')}
                    </button>
                    <button type="button" onClick={handleSubmitApplication} disabled={!projectId} className="app-button disabled:cursor-not-allowed disabled:bg-slate-300">
                      <Send size={14} />
                      {t('Submit application')}
                    </button>
                  </div>
                </>
              )}

              {applyStep === 'success' && (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={28} />
                  </div>
                  <h2 className="section-heading mb-2">{t('Application Submitted')}</h2>
                  <p className="section-subheading">{t('The request has been routed into the service workflow and can now be tracked from your request list.')}</p>
                    <div className="mx-auto mt-5 max-w-md rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-left">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">{t('Reference')}</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-sky-900">{submittedRequestId}</div>
                    <div className="mt-2 text-sm text-slate-600">{t('Expected processing time')}: {t(selectedService.processingTime)}</div>
                  </div>
                  <div className="mt-6">
                    <button type="button" onClick={closeModal} className="app-button">
                      {t('Done')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
