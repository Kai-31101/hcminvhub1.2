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
import { ExplorerActionModal } from '../../components/ExplorerActionModal';
import { ClearableSelectField } from '../../components/ui/clearable-select-field';
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
        <ExplorerActionModal
          onClose={closeModal}
          panelTitle={t('Service Application')}
          leftIcon={<div className="scale-[3]">{iconMap[selectedService.icon]}</div>}
          leftTitle={t('Need help moving this service request forward?')}
          leftDescription={t('Review the requirement package, prepare the supporting files, and submit the application into the city workflow from one place.')}
        >
          <div className="space-y-6">
            {applyStep === 'detail' && (
              <>
                <div className="rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <div className="text-[22px] font-semibold text-[#191c1e]">{t(selectedService.name)}</div>
                    <StatusPill tone={categoryTone(selectedService.category)}>{t(selectedService.category)}</StatusPill>
                  </div>
                  <div className="text-[16px] text-[#617086]">{t(selectedService.agency)}</div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5">
                    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Processing Time')}</div>
                    <div className="mt-2 text-[18px] font-semibold text-[#191c1e]">{t(selectedService.processingTime)}</div>
                  </div>
                  <div className="rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5">
                    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Fee')}</div>
                    <div className="mt-2 text-[18px] font-semibold text-[#191c1e]">{t(selectedService.fee)}</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-[24px] font-semibold text-[#1a2755]">{t('Service Description')}</h2>
                  <p className="mt-2 text-[16px] leading-7 text-[#617086]">{t(selectedService.description)}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-[14px] font-medium text-[#1a2755]">{t('Required Documents')}</div>
                  {selectedService.requiredDocs.map((documentName, index) => (
                    <DataRow key={documentName} className="items-center bg-[#f7f9fb]">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eef3f8] text-sm font-semibold text-[#455f87]">{index + 1}</div>
                      <div className="flex-1 text-[15px] text-[#455f87]">{t(documentName)}</div>
                    </DataRow>
                  ))}
                </div>
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={() => setApplyStep('form')} className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]">
                    <Send size={20} />
                    {t('Apply for service')}
                  </button>
                </div>
              </>
            )}

            {applyStep === 'form' && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Associated Project')} <span className="text-[#f97316]">(*)</span></span>
                    <ClearableSelectField
                      ariaLabel={t('Associated Project')}
                      value={projectId}
                      onChange={setProjectId}
                      placeholder={t('Select project')}
                      options={projects.map((project) => ({ value: project.id, label: t(project.name) }))}
                      className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Document Upload')}</span>
                    <div className="rounded-[16px] border border-dashed border-[#dfe5ec] bg-[#f7f9fb] px-4 py-6 text-center">
                      <Upload size={22} className="mx-auto text-[#8b97a8]" />
                      <div className="mt-2 text-[15px] leading-6 text-[#617086]">{t('Upload required files or simulate the intake package.')}</div>
                      <button
                        type="button"
                        onClick={() => setUploadedDocs(selectedService.requiredDocs.map((_, index) => `Document_${index + 1}.pdf`))}
                        className="mt-4 inline-flex items-center justify-center rounded-[14px] bg-[#e6e8ea] px-5 py-3 text-[15px] font-semibold text-[#3e5980] transition-colors hover:bg-[#dfe3e6]"
                      >
                        {t('Simulate upload')}
                      </button>
                    </div>
                  </div>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Additional Notes')}</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={5}
                      className="min-h-[170px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                      placeholder={t('Add context for the processing agency, missing items, or delivery constraints')}
                    />
                  </label>
                </div>
                {uploadedDocs.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[14px] font-medium text-[#1a2755]">{t('Uploaded Files')}</div>
                    {uploadedDocs.map((documentName) => (
                      <DataRow key={documentName} className="items-center bg-[#f7f9fb]">
                        <CheckCircle2 size={16} className="text-[#2f6f47]" />
                        <div className="flex-1 text-[15px] text-[#455f87]">{t(documentName)}</div>
                      </DataRow>
                    ))}
                  </div>
                )}
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={handleSubmitApplication} disabled={!projectId} className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                    <Send size={20} />
                    {t('Submit application')}
                  </button>
                </div>
              </>
            )}

            {applyStep === 'success' && (
              <div className="space-y-6">
                <div className="rounded-[24px] border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6">
                  <div className="text-[28px] font-semibold text-[#1a2755]">{t('Application Submitted')}</div>
                  <p className="mt-3 text-[16px] leading-7 text-[#617086]">{t('The request has been routed into the service workflow and can now be tracked from your request list.')}</p>
                  <div className="mt-6 rounded-[18px] bg-white px-5 py-5">
                    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Reference')}</div>
                    <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedRequestId}</div>
                    <div className="mt-3 text-[15px] text-[#617086]">{t('Expected processing time')}: {t(selectedService.processingTime)}</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button type="button" onClick={closeModal} className="inline-flex min-w-[240px] items-center justify-center rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white">
                    {t('Done')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </ExplorerActionModal>
      )}
    </div>
  );
}
