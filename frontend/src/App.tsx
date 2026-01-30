import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Filter, Calendar, Download, Plus, Eye, Edit2, Trash2, AlertCircle, CheckCircle2, Clock, Sparkles, Image as ImageIcon, Copy } from 'lucide-react';
import './App.css';

type FormState = {
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
};

type ContentRow = {
  id: string;
  date: string;
  brandHighlight: string;
  crossPromo: string;
  theme: string;
  contentType: string;
  channels: string;
  targetAudience: string;
  primaryGoal: string;
  cta: string;
  promoType: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Scheduled' | 'Published';
  hasCaption: boolean;
  hasImage: boolean;
};

const mockCalendarData: ContentRow[] = [
  {
    id: '1',
    date: '2026-02-15',
    brandHighlight: 'New Spring Collection',
    crossPromo: 'Partner with TechHub',
    theme: 'Innovation & Growth',
    contentType: 'Carousel Post',
    channels: 'Instagram, Facebook',
    targetAudience: 'Young Professionals',
    primaryGoal: 'Brand Awareness',
    cta: 'Shop Now',
    promoType: '20% Off',
    status: 'Approved',
    hasCaption: true,
    hasImage: true,
  },
  {
    id: '2',
    date: '2026-02-18',
    brandHighlight: 'Customer Success Story',
    crossPromo: '',
    theme: 'Community Building',
    contentType: 'Video',
    channels: 'LinkedIn, Twitter',
    targetAudience: 'Business Leaders',
    primaryGoal: 'Engagement',
    cta: 'Learn More',
    promoType: 'Free Trial',
    status: 'In Review',
    hasCaption: true,
    hasImage: false,
  },
  {
    id: '3',
    date: '2026-02-20',
    brandHighlight: 'Product Launch',
    crossPromo: 'Collab with DesignCo',
    theme: 'Innovation',
    contentType: 'Single Image',
    channels: 'Instagram',
    targetAudience: 'Tech Enthusiasts',
    primaryGoal: 'Conversions',
    cta: 'Pre-order Now',
    promoType: 'Early Bird Discount',
    status: 'Draft',
    hasCaption: false,
    hasImage: false,
  },
  {
    id: '4',
    date: '2026-02-22',
    brandHighlight: 'Behind the Scenes',
    crossPromo: '',
    theme: 'Transparency',
    contentType: 'Story',
    channels: 'Instagram, Facebook',
    targetAudience: 'General Audience',
    primaryGoal: 'Brand Awareness',
    cta: 'Swipe Up',
    promoType: '',
    status: 'Scheduled',
    hasCaption: true,
    hasImage: true,
  },
];

function App() {
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().split('T')[0],
    brandHighlight: '',
    crossPromo: '',
    theme: '',
    contentType: '',
    channels: [],
    targetAudience: '',
    primaryGoal: '',
    cta: '',
    promoType: '',
  });

  const [calendarRows, setCalendarRows] = useState<ContentRow[]>(mockCalendarData);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    contentBrief: true,
    distribution: true,
    targeting: true,
    callToAction: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ContentRow | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (field: keyof FormState, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleChannelChange = (channel: string) => {
    const current = form.channels;
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    handleInputChange('channels', updated);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Content generated! (Mock action)');
    }, 2000);
  };

  const handleStatusChange = (id: string, newStatus: ContentRow['status']) => {
    setCalendarRows(prev =>
      prev.map(row => (row.id === id ? { ...row, status: newStatus } : row))
    );
  };

  const handleViewRow = (row: ContentRow) => {
    setSelectedRow(row);
    setIsViewModalOpen(true);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Delete this content entry?')) {
      setCalendarRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const filteredRows = calendarRows.filter(row => {
    const matchesSearch = searchQuery === '' ||
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ContentRow['status']) => {
    const styles = {
      Draft: 'bg-slate-100 text-slate-700 border-slate-300',
      'In Review': 'bg-amber-50 text-amber-700 border-amber-300',
      Approved: 'bg-green-50 text-green-700 border-green-300',
      Scheduled: 'bg-blue-50 text-blue-700 border-blue-300',
      Published: 'bg-violet-50 text-violet-700 border-violet-300',
    };

    const icons = {
      Draft: <Edit2 className="w-3 h-3" />,
      'In Review': <Clock className="w-3 h-3" />,
      Approved: <CheckCircle2 className="w-3 h-3" />,
      Scheduled: <Calendar className="w-3 h-3" />,
      Published: <Sparkles className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const isFormValid = form.date && form.theme && form.contentType && form.channels.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-xl border-b border-slate-600">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Content Studio</h1>
                  <p className="text-xs text-slate-300 tracking-wide">Generate & manage your content calendar</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select className="bg-slate-700 border-slate-600 text-white text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Business Center A</option>
                <option>Business Center B</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Content Generator Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
          {/* Card Header - Collapsible */}
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-900">Content Generator</h2>
                <p className="text-sm text-slate-500">Create new content with AI assistance</p>
              </div>
            </div>
            {isFormExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Form Content */}
          {isFormExpanded && (
            <div className="px-6 pb-6 border-t border-slate-100">
              <form className="space-y-6 mt-6">
                {/* Content Brief Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('contentBrief')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Content Brief</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Required</span>
                    </div>
                    {expandedSections.contentBrief ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </button>

                  {expandedSections.contentBrief && (
                    <div className="p-4 bg-white grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Theme <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.theme}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          placeholder="e.g., Innovation, Community, Growth"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Brand Highlight <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          value={form.brandHighlight}
                          onChange={(e) => handleInputChange('brandHighlight', e.target.value)}
                          placeholder="What aspect of your brand should this content emphasize?"
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Cross Promotion <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.crossPromo}
                          onChange={(e) => handleInputChange('crossPromo', e.target.value)}
                          placeholder="Partner or product to cross-promote"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Distribution Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('distribution')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Distribution</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Required</span>
                    </div>
                    {expandedSections.distribution ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </button>

                  {expandedSections.distribution && (
                    <div className="p-4 bg-white grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Content Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.contentType}
                          onChange={(e) => handleInputChange('contentType', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select type...</option>
                          <option value="Single Image">Single Image</option>
                          <option value="Carousel Post">Carousel Post</option>
                          <option value="Video">Video</option>
                          <option value="Story">Story</option>
                          <option value="Reel">Reel</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Channels <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'].map(channel => (
                            <label
                              key={channel}
                              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium cursor-pointer transition-all ${
                                form.channels.includes(channel)
                                  ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.channels.includes(channel)}
                                onChange={() => handleChannelChange(channel)}
                                className="hidden"
                              />
                              {channel}
                            </label>
                          ))}
                        </div>
                        {form.channels.length === 0 && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Select at least one channel
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Targeting Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('targeting')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Targeting</span>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Optional</span>
                    </div>
                    {expandedSections.targeting ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </button>

                  {expandedSections.targeting && (
                    <div className="p-4 bg-white grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Audience</label>
                        <input
                          type="text"
                          value={form.targetAudience}
                          onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                          placeholder="e.g., Young Professionals, Business Leaders"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Goal</label>
                        <select
                          value={form.primaryGoal}
                          onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select goal...</option>
                          <option value="Brand Awareness">Brand Awareness</option>
                          <option value="Engagement">Engagement</option>
                          <option value="Conversions">Conversions</option>
                          <option value="Traffic">Traffic</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call to Action Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('callToAction')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Call to Action</span>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Optional</span>
                    </div>
                    {expandedSections.callToAction ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </button>

                  {expandedSections.callToAction && (
                    <div className="p-4 bg-white grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">CTA Text</label>
                        <input
                          type="text"
                          value={form.cta}
                          onChange={(e) => handleInputChange('cta', e.target.value)}
                          placeholder="e.g., Shop Now, Learn More"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Promotion Type</label>
                        <input
                          type="text"
                          value={form.promoType}
                          onChange={(e) => handleInputChange('promoType', e.target.value)}
                          placeholder="e.g., 20% Off, Free Trial"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Reset Form
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!isFormValid || isGenerating}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Content
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Validation Message */}
                {!isFormValid && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <strong className="font-semibold">Required fields missing:</strong> Please fill in Date, Theme, Content Type, and select at least one Channel.
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Content Calendar Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Content Calendar</h2>
                  <p className="text-sm text-slate-500">View and manage your scheduled content</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calendar Table */}
          <div className="overflow-x-auto">
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No content found</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {searchQuery || statusFilter !== 'All'
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by generating your first piece of content'}
                </p>
                {(searchQuery || statusFilter !== 'All') && (
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Theme</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Channels</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assets</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{row.theme}</div>
                        {row.brandHighlight && (
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{row.brandHighlight}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{row.contentType}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.channels.split(', ').map(channel => (
                            <span key={channel} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          onChange={(e) => handleStatusChange(row.id, e.target.value as ContentRow['status'])}
                          className="text-xs font-semibold border-0 bg-transparent cursor-pointer focus:ring-2 focus:ring-blue-500 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Published">Published</option>
                        </select>
                        <div className="mt-1">{getStatusBadge(row.status)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.hasCaption ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Caption
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">No caption</span>
                          )}
                          {row.hasImage && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <ImageIcon className="w-3 h-3" />
                              Image
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewRow(row)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer */}
          {filteredRows.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{filteredRows.length}</span> of <span className="font-semibold text-slate-900">{calendarRows.length}</span> entries
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Previous
                </button>
                <div className="px-3 py-1.5 bg-blue-500 text-white rounded-lg font-medium">1</div>
                <button className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Content Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {new Date(selectedRow.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRow.status)}
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-slate-400 hover:text-slate-600">&times;</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Content Brief</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Theme</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedRow.theme}</p>
                      </div>
                      {selectedRow.brandHighlight && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Brand Highlight</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.brandHighlight}</p>
                        </div>
                      )}
                      {selectedRow.crossPromo && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cross Promotion</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.crossPromo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Distribution</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Content Type</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedRow.contentType}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Channels</label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedRow.channels.split(', ').map(channel => (
                            <span key={channel} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Targeting & Goals</h4>
                    <div className="space-y-3">
                      {selectedRow.targetAudience && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Audience</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.targetAudience}</p>
                        </div>
                      )}
                      {selectedRow.primaryGoal && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Primary Goal</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.primaryGoal}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Call to Action</h4>
                    <div className="space-y-3">
                      {selectedRow.cta && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CTA Text</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.cta}</p>
                        </div>
                      )}
                      {selectedRow.promoType && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Promotion</label>
                          <p className="text-sm text-slate-900 mt-1">{selectedRow.promoType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Generated Assets
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">Caption</span>
                        {selectedRow.hasCaption ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Not generated</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">Image</span>
                        {selectedRow.hasImage ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Not generated</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
