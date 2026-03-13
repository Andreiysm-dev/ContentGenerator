import React from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  AddCompanyModal,
  BulkImportModal,
  ConfirmModal,
  CopyModal,
  CsvExportModal,
  DraftPublishModal,
  ImageGenerationModal,
  OnboardingModal,
  ViewContentModal,
} from '@/modals';
import { ProductTour } from '@/components/ProductTour';
import { AIAssistant } from '@/components/AIAssistant';
import { getAttachedDesignUrls, getImageGeneratedSignature, getImageGeneratedUrl } from '@/utils/contentUtils';

interface AppOverlaysProps {
  isOnboardingOpen: boolean;
  handleOnboardingComplete: (data: any) => Promise<void>;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
  isAiAssistantOpen: boolean;
  isCreatingCompany: boolean;
  isAddCompanyModalOpen: boolean;
  setIsAddCompanyModalOpen: (value: boolean) => void;
  newCompanyName: string;
  setNewCompanyName: (value: string) => void;
  newCompanyDescription: string;
  setNewCompanyDescription: (value: string) => void;
  handleAddCompany: () => Promise<void>;
  isCsvModalOpen: boolean;
  setIsCsvModalOpen: (value: boolean) => void;
  csvScope: React.ComponentProps<typeof CsvExportModal>['csvScope'];
  setCsvScope: React.ComponentProps<typeof CsvExportModal>['setCsvScope'];
  csvFieldSelection: React.ComponentProps<typeof CsvExportModal>['csvFieldSelection'];
  setCsvFieldSelection: React.ComponentProps<typeof CsvExportModal>['setCsvFieldSelection'];
  csvFieldDefinitions: any[];
  handleExportCsv: () => void;
  isCopyModalOpen: boolean;
  setIsCopyModalOpen: (value: boolean) => void;
  setCopySuccessMessage: (value: string) => void;
  copyFieldSelection: React.ComponentProps<typeof CopyModal>['copyFieldSelection'];
  setCopyFieldSelection: React.ComponentProps<typeof CopyModal>['setCopyFieldSelection'];
  copyFieldDefinitions: any[];
  copySuccessMessage: string;
  handleCopySpreadsheet: () => void;
  isDraftModalOpen: boolean;
  setIsDraftModalOpen: (value: boolean) => void;
  selectedRow: any;
  activeCompany: any;
  draftPublishIntent: 'draft' | 'ready';
  setDraftPublishIntent: (value: 'draft' | 'ready') => void;
  handleDraftPublishIntent: (overrideStatus?: string) => Promise<void>;
  imagePreviewNonce: number;
  handleCopy: (fieldKey: string, text?: string | null) => void;
  copiedField: string | null;
  handleUploadDesigns: (files: FileList | null) => Promise<void>;
  isUploadingDesigns: boolean;
  isBulkModalOpen: boolean;
  setIsBulkModalOpen: (value: boolean) => void;
  bulkText: string;
  setBulkText: (value: string) => void;
  bulkPreview: React.ComponentProps<typeof BulkImportModal>['bulkPreview'];
  setBulkPreview: React.ComponentProps<typeof BulkImportModal>['setBulkPreview'];
  showPreview: boolean;
  setShowPreview: (value: boolean) => void;
  isImporting: boolean;
  parseBulkText: (text: string) => string[][];
  handleBulkImport: () => Promise<void>;
  isViewModalOpen: boolean;
  setIsViewModalOpen: (value: boolean) => void;
  getStatusValue: (status: any) => string;
  requestConfirm: (config: any) => Promise<boolean | 'third'>;
  isGeneratingCaption: boolean;
  setIsGeneratingCaption: (value: boolean) => void;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  refreshCalendarRow: (rowId: string) => Promise<any>;
  setIsImageModalOpen: (value: boolean) => void;
  activeCompanyId?: string | null;
  setBrandKbId: (value: string | null) => void;
  setSystemInstruction: (value: string) => void;
  collaborators: any[];
  automations: any[];
  userPermissions: any;
  filteredCalendarRows: any[];
  setSelectedRow: (value: any) => void;
  isImageModalOpen: boolean;
  isEditingDmp: boolean;
  setIsEditingDmp: (value: boolean) => void;
  dmpDraft: string;
  setDmpDraft: (value: string) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (value: boolean) => void;
  imagePollError: string | null;
  setCalendarRows: React.Dispatch<React.SetStateAction<any[]>>;
  brandKbId: string | null;
  systemInstruction: string;
  reopenImageModalOnImageReadyRef: React.MutableRefObject<boolean>;
  imageModalReopenTimeoutRef: React.MutableRefObject<number | null>;
  startWaitingForImageUpdate: (baseSignature: string | null) => void | (() => void);
  toast: { message: string; tone?: 'success' | 'error' | 'info' } | null;
  isConfirmOpen: boolean;
  confirmConfig: any;
  resolveConfirm: (value: boolean | 'third') => void;
  showProductTour: boolean;
  setShowProductTour: (value: boolean) => void;
  userProfile: any;
  navigate: (to: string) => void;
  setPreDefinedPlan: (plan: any[] | null) => void;
  refreshAppData: () => Promise<void>;
  setIsAiAssistantOpen: (value: boolean) => void;
}

export function AppOverlays({
  isOnboardingOpen,
  handleOnboardingComplete,
  notify,
  isAiAssistantOpen,
  isCreatingCompany,
  isAddCompanyModalOpen,
  setIsAddCompanyModalOpen,
  newCompanyName,
  setNewCompanyName,
  newCompanyDescription,
  setNewCompanyDescription,
  handleAddCompany,
  isCsvModalOpen,
  setIsCsvModalOpen,
  csvScope,
  setCsvScope,
  csvFieldSelection,
  setCsvFieldSelection,
  csvFieldDefinitions,
  handleExportCsv,
  isCopyModalOpen,
  setIsCopyModalOpen,
  setCopySuccessMessage,
  copyFieldSelection,
  setCopyFieldSelection,
  copyFieldDefinitions,
  copySuccessMessage,
  handleCopySpreadsheet,
  isDraftModalOpen,
  setIsDraftModalOpen,
  selectedRow,
  activeCompany,
  draftPublishIntent,
  setDraftPublishIntent,
  handleDraftPublishIntent,
  imagePreviewNonce,
  handleCopy,
  copiedField,
  handleUploadDesigns,
  isUploadingDesigns,
  isBulkModalOpen,
  setIsBulkModalOpen,
  bulkText,
  setBulkText,
  bulkPreview,
  setBulkPreview,
  showPreview,
  setShowPreview,
  isImporting,
  parseBulkText,
  handleBulkImport,
  isViewModalOpen,
  setIsViewModalOpen,
  getStatusValue,
  requestConfirm,
  isGeneratingCaption,
  setIsGeneratingCaption,
  authedFetch,
  backendBaseUrl,
  refreshCalendarRow,
  setIsImageModalOpen,
  activeCompanyId,
  setBrandKbId,
  setSystemInstruction,
  collaborators,
  automations,
  userPermissions,
  filteredCalendarRows,
  setSelectedRow,
  isImageModalOpen,
  isEditingDmp,
  setIsEditingDmp,
  dmpDraft,
  setDmpDraft,
  isGeneratingImage,
  setIsGeneratingImage,
  imagePollError,
  setCalendarRows,
  brandKbId,
  systemInstruction,
  reopenImageModalOnImageReadyRef,
  imageModalReopenTimeoutRef,
  startWaitingForImageUpdate,
  toast,
  isConfirmOpen,
  confirmConfig,
  resolveConfirm,
  showProductTour,
  setShowProductTour,
  userProfile,
  navigate,
  setPreDefinedPlan,
  refreshAppData,
  setIsAiAssistantOpen,
}: AppOverlaysProps) {
  return (
    <>
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        notify={notify}
        isAiAssistantOpen={isAiAssistantOpen}
        isLoading={isCreatingCompany}
      />

      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        newCompanyName={newCompanyName}
        setNewCompanyName={setNewCompanyName}
        newCompanyDescription={newCompanyDescription}
        setNewCompanyDescription={setNewCompanyDescription}
        onSubmit={handleAddCompany}
        notify={notify}
        isAiAssistantOpen={isAiAssistantOpen}
        isLoading={isCreatingCompany}
      />

      <CsvExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        csvScope={csvScope}
        setCsvScope={setCsvScope}
        csvFieldSelection={csvFieldSelection}
        setCsvFieldSelection={setCsvFieldSelection}
        csvFieldDefinitions={csvFieldDefinitions}
        handleExportCsv={handleExportCsv}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      <CopyModal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setCopySuccessMessage('');
        }}
        copyFieldSelection={copyFieldSelection}
        setCopyFieldSelection={setCopyFieldSelection}
        copyFieldDefinitions={copyFieldDefinitions}
        copySuccessMessage={copySuccessMessage}
        handleCopySpreadsheet={handleCopySpreadsheet}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      <DraftPublishModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        selectedRow={selectedRow}
        activeCompany={activeCompany}
        draftPublishIntent={draftPublishIntent}
        setDraftPublishIntent={setDraftPublishIntent}
        handleDraftPublishIntent={handleDraftPublishIntent}
        getAttachedDesignUrls={getAttachedDesignUrls}
        getImageGeneratedUrl={getImageGeneratedUrl}
        imagePreviewNonce={imagePreviewNonce}
        handleCopy={handleCopy}
        copiedField={copiedField}
        handleUploadDesigns={handleUploadDesigns}
        isUploadingDesigns={isUploadingDesigns}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        bulkText={bulkText}
        setBulkText={setBulkText}
        bulkPreview={bulkPreview}
        setBulkPreview={setBulkPreview}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        isImporting={isImporting}
        parseBulkText={parseBulkText}
        handleBulkImport={handleBulkImport}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      <ViewContentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        selectedRow={selectedRow}
        getStatusValue={getStatusValue}
        getImageGeneratedUrl={getImageGeneratedUrl}
        imagePreviewNonce={imagePreviewNonce}
        handleCopy={handleCopy}
        copiedField={copiedField}
        notify={notify}
        setIsDraftModalOpen={setIsDraftModalOpen}
        setDraftPublishIntent={setDraftPublishIntent}
        requestConfirm={requestConfirm}
        isGeneratingCaption={isGeneratingCaption}
        setIsGeneratingCaption={setIsGeneratingCaption}
        authedFetch={authedFetch}
        backendBaseUrl={backendBaseUrl}
        refreshCalendarRow={refreshCalendarRow}
        setIsImageModalOpen={setIsImageModalOpen}
        setIsViewModalOpen={setIsViewModalOpen}
        activeCompanyId={activeCompanyId ?? undefined}
        activeCompany={activeCompany}
        setBrandKbId={setBrandKbId}
        setSystemInstruction={setSystemInstruction}
        isAiAssistantOpen={isAiAssistantOpen}
        collaborators={collaborators}
        automations={automations}
        userPermissions={userPermissions}
        allRows={filteredCalendarRows}
        onNavigate={(row) => setSelectedRow(row)}
      />

      <ImageGenerationModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        selectedRow={selectedRow}
        isEditingDmp={isEditingDmp}
        setIsEditingDmp={setIsEditingDmp}
        dmpDraft={dmpDraft}
        setDmpDraft={setDmpDraft}
        isGeneratingImage={isGeneratingImage}
        setIsGeneratingImage={setIsGeneratingImage}
        getImageGeneratedUrl={getImageGeneratedUrl}
        imagePreviewNonce={imagePreviewNonce}
        imagePollError={imagePollError}
        notify={notify}
        authedFetch={authedFetch}
        backendBaseUrl={backendBaseUrl}
        setSelectedRow={setSelectedRow}
        setCalendarRows={setCalendarRows}
        setIsImageModalOpen={setIsImageModalOpen}
        activeCompanyId={activeCompanyId ?? undefined}
        brandKbId={brandKbId}
        systemInstruction={systemInstruction}
        requestConfirm={requestConfirm}
        reopenImageModalOnImageReadyRef={reopenImageModalOnImageReadyRef}
        imageModalReopenTimeoutRef={imageModalReopenTimeoutRef}
        getImageGeneratedSignature={getImageGeneratedSignature}
        startWaitingForImageUpdate={startWaitingForImageUpdate}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      {toast && (
        <div
          className={`fixed bottom-24 ${isAiAssistantOpen ? 'right-[424px]' : 'right-6'} transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border shadow-premium-lg z-[9999] animate-[toast-slide-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-md max-w-[400px] ${toast.tone === 'success' ? 'border-emerald-500/30 bg-emerald-50/95 text-emerald-800' :
            toast.tone === 'error' ? 'border-rose-500/30 bg-rose-50/95 text-rose-800' :
              'border-brand-primary/30 bg-sky-50/95 text-brand-dark'
            }`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast.tone === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" aria-hidden />}
          {toast.tone === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 text-rose-500" aria-hidden />}
          {(toast.tone === 'info' || !toast.tone) && <Info className="w-5 h-5 flex-shrink-0 text-brand-primary" aria-hidden />}
          <span className="text-sm font-semibold leading-tight">{toast.message}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        config={confirmConfig}
        onResolve={resolveConfirm}
        isAiAssistantOpen={isAiAssistantOpen}
      />

      {showProductTour && (
        <ProductTour
          companyId={activeCompanyId || ''}
          onComplete={() => {
            setShowProductTour(false);
            if (userProfile?.id) {
              localStorage.setItem(`productTourCompleted_${userProfile.id}`, 'true');
            }
          }}
          onSkip={() => {
            setShowProductTour(false);
            if (userProfile?.id) {
              localStorage.setItem(`productTourCompleted_${userProfile.id}`, 'true');
            }
          }}
        />
      )}

      <AIAssistant
        activeCompanyId={activeCompanyId}
        authedFetch={authedFetch}
        navigate={navigate}
        notify={notify}
        extraContext={{ selectedRow }}
        onRefresh={refreshAppData}
        isOpen={isAiAssistantOpen}
        setIsOpen={setIsAiAssistantOpen}
        onApplyPlan={(plan: any[]) => {
          setPreDefinedPlan(plan);
          if (activeCompanyId) {
            navigate(`/company/${activeCompanyId}/plan`);
            notify('Strategy applied to planner. Review and push to calendar!', 'success');
          }
        }}
        backendBaseUrl={backendBaseUrl}
      />
    </>
  );
}
