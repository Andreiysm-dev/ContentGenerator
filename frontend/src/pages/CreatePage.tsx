import { FileText, Target, Rocket, Plus } from 'lucide-react';
import type { ChangeEventHandler } from 'react';

interface FormState {
    date: string;
    brandHighlight: string;
    crossPromo: string;
    theme: string;
    contentType: string;
    channels: string[];
    targetAudience: string;
    primaryGoal: string;
    cta: string;
    promoType: string;
}

interface CreatePageProps {
    form: FormState;
    handleChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    handleAdd: () => Promise<void>;
    isAdding: boolean;
    setBulkText: (value: string) => void;
    setBulkPreview: (value: string[][]) => void;
    setShowPreview: (value: boolean) => void;
    setIsBulkModalOpen: (value: boolean) => void;
}

export function CreatePage({
    form,
    handleChange,
    handleAdd,
    isAdding,
    setBulkText,
    setBulkPreview,
    setShowPreview,
    setIsBulkModalOpen,
}: CreatePageProps) {
    return (
        <main className="app-main">
            <section className="card generator-card">
                <div className="settings-header generator-header">
                    <div>
                        <h2>Content Generator</h2>
                        <p>Create captions and content drafts for your calendar.</p>
                    </div>
                    <div className="company-page-actions">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                setBulkText('');
                                setBulkPreview([]);
                                setShowPreview(false);
                                setIsBulkModalOpen(true);
                            }}
                        >
                            Bulk paste
                        </button>
                    </div>
                </div>

                <div className="generator-form">
                    <div className="form-section">
                        <div className="form-section-header">
                            <h3 className="form-section-title">
                                <FileText style={{ width: '18px', height: '18px', color: 'var(--brand-500)' }} />
                                Content Brief
                            </h3>
                            <p className="form-section-desc">Define what the post is about and the core theme.</p>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="field-label">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Brand Highlight (80%)</label>
                                <input
                                    type="text"
                                    name="brandHighlight"
                                    placeholder="e.g., Coworking Space"
                                    value={form.brandHighlight}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Cross-Promo (20%)</label>
                                <input
                                    type="text"
                                    name="crossPromo"
                                    placeholder="e.g., Zen Café"
                                    value={form.crossPromo}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Theme</label>
                                <input
                                    type="text"
                                    name="theme"
                                    placeholder="e.g., Your Startup's First Home"
                                    value={form.theme}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-header">
                            <h3 className="form-section-title">
                                <Target style={{ width: '18px', height: '18px', color: 'var(--brand-500)' }} />
                                Distribution
                            </h3>
                            <p className="form-section-desc">Choose where the content will go and who it serves.</p>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="field-label">Content Type</label>
                                <select
                                    name="contentType"
                                    value={form.contentType}
                                    onChange={handleChange}
                                    className="field-input select-input"
                                >
                                    <option value="">Select content type</option>
                                    <option value="Promo">Promo</option>
                                    <option value="Educational">Educational</option>
                                    <option value="Story">Story</option>
                                    <option value="Testimonial">Testimonial</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="field-label">Target Audience</label>
                                <input
                                    type="text"
                                    name="targetAudience"
                                    placeholder="e.g., Startup Founders"
                                    value={form.targetAudience}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Primary Goal</label>
                                <select
                                    name="primaryGoal"
                                    value={form.primaryGoal}
                                    onChange={handleChange}
                                    className="field-input select-input"
                                >
                                    <option value="">Select a goal</option>
                                    <option value="Awareness">Awareness</option>
                                    <option value="Engagement">Engagement</option>
                                    <option value="Traffic">Traffic</option>
                                    <option value="Leads">Leads</option>
                                    <option value="Sales">Sales</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-header">
                            <h3 className="form-section-title">
                                <Rocket style={{ width: '18px', height: '18px', color: 'var(--brand-500)' }} />
                                Call to Action
                            </h3>
                            <p className="form-section-desc">Define the action and promotional angle.</p>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="field-label">Call to Action</label>
                                <input
                                    type="text"
                                    name="cta"
                                    placeholder="e.g., Book a Tour"
                                    value={form.cta}
                                    onChange={handleChange}
                                    className="field-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="field-label">Promo Type</label>
                                <select
                                    name="promoType"
                                    value={form.promoType}
                                    onChange={handleChange}
                                    className="field-input select-input"
                                >
                                    <option value="">Select promo type</option>
                                    <option value="Launch">Launch</option>
                                    <option value="Discount">Discount</option>
                                    <option value="Evergreen">Evergreen</option>
                                    <option value="Event">Event</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={isAdding}
                            className="btn btn-primary"
                        >
                            {isAdding ? (
                                <>
                                    <span className="loading-spinner loading-spinner-sm" style={{ marginRight: '8px', borderLeftColor: '#fff' }} />
                                    Adding…
                                </>
                            ) : (
                                <>
                                    <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                                    Add to Calendar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
