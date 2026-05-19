'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig as siteConfigApi, media as mediaApi, ai as aiApi } from '@/lib/api';
import { toast } from 'sonner';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const defaultSocialLinks = JSON.stringify({ twitter: '', github: '', linkedin: '' }, null, 2);

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [socialLinksText, setSocialLinksText] = useState(defaultSocialLinks);
  const [socialJsonError, setSocialJsonError] = useState<string | null>(null);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [faviconPickerOpen, setFaviconPickerOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [logoGenerating, setLogoGenerating] = useState(false);
  const [faviconGenerating, setFaviconGenerating] = useState(false);
  const [privacyGenerating, setPrivacyGenerating] = useState(false);
  const [termsGenerating, setTermsGenerating] = useState(false);
  const [privacyView, setPrivacyView] = useState<'edit' | 'preview'>('edit');
  const [termsView, setTermsView] = useState<'edit' | 'preview'>('preview');
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    siteConfigApi.get()
      .then(data => {
        setConfig(data);
        setSocialLinksText(data.socialLinks || defaultSocialLinks);
      })
      .catch(() => {
        setConfig({
          siteTitle: 'AI Blog',
          siteTagline: '',
          siteDescription: '',
          adminTitle: 'Blog Admin',
          logoUrl: '',
          faviconUrl: '',
          footerText: '',
          copyrightText: '',
          contactEmail: '',
          socialLinks: '{}',
          seoHomeTitle: '',
          seoHomeDescription: '',
          postsPerPage: 10,
          enableComments: true,
          customHeadHtml: '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const validateSocialJson = (value: string) => {
    try {
      JSON.parse(value);
      setSocialJsonError(null);
      return true;
    } catch {
      setSocialJsonError(t('admin.invalidJsonFormat'));
      return false;
    }
  };

  const handleSocialLinksChange = (value: string) => {
    setSocialLinksText(value);
    validateSocialJson(value);
  };

  const handleMediaUpload = async (field: 'logoUrl' | 'faviconUrl', file: File | undefined) => {
    if (!file) return;
    const setUploading = field === 'logoUrl' ? setLogoUploading : setFaviconUploading;
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      updateField(field, uploaded.url);
      toast.success(t('admin.imageUploaded'));
    } catch (err: any) {
      toast.error(err.message || t('admin.uploadFailed'));
    }
    setUploading(false);
  };

  const handleGenerateLogo = async () => {
    const brandName = config.siteTitle || 'AI Blog';
    setLogoGenerating(true);
    try {
      const result = await aiApi.generateLogo({ brandName, tagline: config.siteTagline });
      if (result.url) {
        updateField('logoUrl', result.url);
        toast.success(t('admin.logoGenerated'));
      } else {
        toast.error(t('admin.aiImageNotConfigured'));
      }
    } catch (err: any) {
      toast.error(err.message || t('admin.failedGenerateLogo'));
    }
    setLogoGenerating(false);
  };

  const handleGenerateFavicon = async () => {
    const brandName = config.siteTitle || 'AI Blog';
    setFaviconGenerating(true);
    try {
      const result = await aiApi.generateFavicon({ brandName });
      if (result.url) {
        updateField('faviconUrl', result.url);
        toast.success(t('admin.faviconGenerated'));
      } else {
        toast.error(t('admin.aiGenNotConfigured'));
      }
    } catch (err: any) {
      toast.error(err.message || t('admin.failedGenerateFavicon'));
    }
    setFaviconGenerating(false);
  };

  const handleGeneratePolicy = async (type: 'privacy' | 'terms') => {
    const setGenerating = type === 'privacy' ? setPrivacyGenerating : setTermsGenerating;
    setGenerating(true);
    try {
      const result = await aiApi.generateLegalPolicy({
        type,
        siteName: config.siteTitle || 'AI Blog',
        siteUrl: (typeof window !== 'undefined' ? window.location.origin : '') || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
        siteEmail: config.contactEmail || '',
      });
      if (result.content) {
        const field = type === 'privacy' ? 'privacyPolicyContent' : 'termsOfUseContent';
        updateField(field, result.content);
        toast.success(type === 'privacy' ? t('admin.privacyGenerated') : t('admin.termsGenerated'));
      } else {
        toast.error(t('admin.aiGenNotConfigured'));
      }
    } catch (err: any) {
      toast.error(err.message || t('admin.failedGeneratePolicy'));
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (socialJsonError) {
      toast.error(t('admin.fixSocialJson'));
      return;
    }

    setSaving(true);
    try {
      const { id, createdAt, updatedAt, ...cleanConfig } = config;
      const payload = {
        ...cleanConfig,
        socialLinks: socialLinksText,
      };
      const result = await siteConfigApi.update(payload);
      setConfig(result);
      setSocialLinksText(result.socialLinks || socialLinksText);
      toast.success(t('admin.settingsSaved'));
    } catch (err: any) {
      toast.error(err.message || t('admin.failedSaveConfig'));
    } finally {
      setSaving(false);
    }
  };

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-8">{t('admin.settings')}</h1>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-40 bg-surface-container-high/50 animate-pulse rounded" />
                <div className="space-y-3">
                  <div className="h-10 w-full bg-surface-container-high/50 animate-pulse rounded" />
                  <div className="h-10 w-full bg-surface-container-high/50 animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---------- MAIN CONTENT ----------
  return (
    <div className="max-w-4xl">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('admin.settings')}</h1>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">save</span>
          {saving ? t('admin.saving') : t('admin.saveSettings')}
        </Button>
      </div>

      {/* ---- Tab Navigation ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          {(['general', 'branding', 'content', 'seo', 'footer', 'advanced', 'legal'] as const).map(tab => {
            const iconMap: Record<string, string> = {
              general: 'public',
              branding: 'palette',
              content: 'description',
              seo: 'search',
              footer: 'vertical_align_bottom',
              advanced: 'code',
              legal: 'gavel',
            };
            const labelMap: Record<string, string> = {
              general: t('admin.general'),
              branding: t('admin.branding'),
              content: t('admin.contentSettings'),
              seo: t('admin.seo'),
              footer: t('admin.footer'),
              advanced: t('admin.advanced'),
              legal: t('admin.legal'),
            };
            return (
              <TabsTrigger key={tab} value={tab}>
                <span className="material-symbols-outlined text-[18px] mr-1" aria-hidden="true">{iconMap[tab]}</span>
                {labelMap[tab]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.siteIdentity')}</CardTitle>
              <CardDescription>{t('admin.siteIdentityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>{t('admin.siteTitle')}</Label>
                <Input
                  value={config.siteTitle || ''}
                  onChange={e => updateField('siteTitle', e.target.value)}
                  placeholder={t('admin.siteTitlePlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.siteTitleHint')}</p>
              </div>
              <div>
                <Label>{t('admin.tagline')}</Label>
                <Input
                  value={config.siteTagline || ''}
                  onChange={e => updateField('siteTagline', e.target.value)}
                  placeholder={t('admin.taglinePlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.taglineHint')}</p>
              </div>
              <div>
                <Label>{t('admin.siteDescription')}</Label>
                <Textarea
                  value={config.siteDescription || ''}
                  onChange={e => updateField('siteDescription', e.target.value)}
                  placeholder={t('admin.siteDescriptionPlaceholder')}
                  rows={3}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.siteDescriptionHint')}</p>
              </div>
              <div>
                <Label>{t('admin.adminTitle')}</Label>
                <Input
                  value={config.adminTitle || ''}
                  onChange={e => updateField('adminTitle', e.target.value)}
                  placeholder={t('admin.adminTitlePlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.adminTitleHint')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.logosIcons')}</CardTitle>
              <CardDescription>{t('admin.logosIconsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <Label>{t('admin.logoUrl')}</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={config.logoUrl || ''}
                    onChange={e => updateField('logoUrl', e.target.value)}
                    placeholder={t('admin.logoUrlPlaceholder')}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setLogoPickerOpen(true)} title={t('admin.browseMedia')}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">image</span>
                  </Button>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="icon" disabled={logoUploading} title={t('admin.uploadImage')} asChild>
                      <span>
                        <span className={`material-symbols-outlined text-[20px] ${logoUploading ? 'animate-spin' : ''}`} aria-hidden="true">{logoUploading ? 'progress_activity' : 'upload'}</span>
                      </span>
                    </Button>
                    <input ref={logoFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('logoUrl', e.target.files?.[0]); if (logoFileRef.current) logoFileRef.current.value = ''; }} />
                  </label>
                  <Button variant="outline" size="icon" onClick={handleGenerateLogo} disabled={logoGenerating} title={t('admin.generateLogoAI')}>
                    <span className={`material-symbols-outlined text-[20px] text-primary ${logoGenerating ? 'animate-spin' : ''}`} aria-hidden="true">{logoGenerating ? 'progress_activity' : 'auto_awesome'}</span>
                  </Button>
                  {config.logoUrl && (
                    <Button variant="outline" size="icon" onClick={() => updateField('logoUrl', '')} title={t('admin.remove')}>
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                    </Button>
                  )}
                </div>
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.logoHint')}</p>
                {config.logoUrl && (
                  <div className="mt-3 bg-black/20 border border-border rounded-lg p-3 inline-flex items-center gap-3">
                    <img src={config.logoUrl} alt={t('admin.logoPreview')} className="h-10 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-label-sm text-on-surface-variant max-w-[200px] truncate">{config.logoUrl}</span>
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div>
                <Label>{t('admin.faviconUrl')}</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={config.faviconUrl || ''}
                    onChange={e => updateField('faviconUrl', e.target.value)}
                    placeholder={t('admin.faviconUrlPlaceholder')}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setFaviconPickerOpen(true)} title={t('admin.browseMedia')}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">image</span>
                  </Button>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="icon" disabled={faviconUploading} title={t('admin.uploadImage')} asChild>
                      <span>
                        <span className={`material-symbols-outlined text-[20px] ${faviconUploading ? 'animate-spin' : ''}`} aria-hidden="true">{faviconUploading ? 'progress_activity' : 'upload'}</span>
                      </span>
                    </Button>
                    <input ref={faviconFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('faviconUrl', e.target.files?.[0]); if (faviconFileRef.current) faviconFileRef.current.value = ''; }} />
                  </label>
                  <Button variant="outline" size="icon" onClick={handleGenerateFavicon} disabled={faviconGenerating} title={t('admin.generateFaviconAI')}>
                    <span className={`material-symbols-outlined text-[20px] text-primary ${faviconGenerating ? 'animate-spin' : ''}`} aria-hidden="true">{faviconGenerating ? 'progress_activity' : 'auto_awesome'}</span>
                  </Button>
                  {config.faviconUrl && (
                    <Button variant="outline" size="icon" onClick={() => updateField('faviconUrl', '')} title={t('admin.remove')}>
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                    </Button>
                  )}
                </div>
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.faviconHint')}</p>
                {config.faviconUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={config.faviconUrl} alt={t('admin.faviconPreview')} className="w-8 h-8 object-contain rounded border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-label-sm text-on-surface-variant max-w-[200px] truncate">{config.faviconUrl}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <MediaPickerDialog open={logoPickerOpen} onOpenChange={setLogoPickerOpen} onSelect={url => updateField('logoUrl', url)} />
          <MediaPickerDialog open={faviconPickerOpen} onOpenChange={setFaviconPickerOpen} onSelect={url => updateField('faviconUrl', url)} />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.readingDiscussion')}</CardTitle>
              <CardDescription>{t('admin.readingDiscussionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>{t('admin.postsPerPage')}</Label>
                <div className="relative w-32 mt-1.5">
                  <select
                    value={String(config.postsPerPage || 10)}
                    onChange={e => updateField('postsPerPage', Number(e.target.value))}
                    className="w-full appearance-none bg-surface-container border border-border rounded-lg px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer pr-8"
                  >
                    {[5, 10, 15, 20, 25, 30, 50].map(n => (
                      <option key={n} value={String(n)} className="bg-surface-container text-on-surface">{n}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant" aria-hidden="true">expand_more</span>
                  </div>
                </div>
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.postsPerPageHint')}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>{t('admin.enableComments')}</Label>
                  <p className="text-label-sm text-on-surface-variant/70">{t('admin.enableCommentsHint')}</p>
                </div>
                <Switch
                  checked={config.enableComments !== false}
                  onCheckedChange={(checked) => updateField('enableComments', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.homepageSEO')}</CardTitle>
              <CardDescription>{t('admin.homepageSEODesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>{t('admin.seoTitle')}</Label>
                <Input
                  value={config.seoHomeTitle || ''}
                  onChange={e => updateField('seoHomeTitle', e.target.value)}
                  placeholder={t('admin.seoTitlePlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">
                  {t('admin.seoTitleHint')}
                  <span className="block mt-1 text-primary font-medium">
                    {t('admin.preview')}: {config.seoHomeTitle || config.siteTitle || 'AI Blog'}
                  </span>
                </p>
              </div>
              <div>
                <Label>{t('admin.seoDescription')}</Label>
                <Textarea
                  value={config.seoHomeDescription || ''}
                  onChange={e => updateField('seoHomeDescription', e.target.value)}
                  placeholder={t('admin.seoDescriptionPlaceholder')}
                  rows={3}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">
                  {t('admin.seoDescriptionHint')}
                  <span className="block mt-1">
                    {t('admin.current')}: <span className={((config.seoHomeDescription || '').length > 160) ? 'text-error' : 'text-on-surface-variant'}>{config.seoHomeDescription?.length || 0} {t('admin.characters')}</span>
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.footerContact')}</CardTitle>
              <CardDescription>{t('admin.footerContactDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>{t('admin.footerText')}</Label>
                <Input
                  value={config.footerText || ''}
                  onChange={e => updateField('footerText', e.target.value)}
                  placeholder={t('admin.footerTextPlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.footerTextHint')}</p>
              </div>
              <div>
                <Label>{t('admin.copyrightText')}</Label>
                <Input
                  value={config.copyrightText || ''}
                  onChange={e => updateField('copyrightText', e.target.value)}
                  placeholder={`© ${new Date().getFullYear()} ${t('admin.copyrightPlaceholder')}`}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.copyrightTextHint')}</p>
              </div>
              <div>
                <Label>{t('admin.contactEmail')}</Label>
                <Input
                  type="email"
                  value={config.contactEmail || ''}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  placeholder={t('admin.contactEmailPlaceholder')}
                  className="mt-1.5"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">{t('admin.contactEmailHint')}</p>
              </div>
              <div>
                <Label>{t('admin.socialLinks')}</Label>
                <Textarea
                  value={socialLinksText}
                  onChange={e => handleSocialLinksChange(e.target.value)}
                  rows={4}
                  className="mt-1.5 font-mono text-sm"
                />
                {socialJsonError && (
                  <p className="text-label-sm text-error mt-1">{socialJsonError}</p>
                )}
                <p className="text-label-sm text-on-surface-variant/70 mt-1">
                  {t('admin.socialLinksHint')} <code className="text-tertiary">{'{ "twitter": "https://twitter.com/...", "github": "https://github.com/...", "linkedin": "https://linkedin.com/in/..." }'}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.customCode')}</CardTitle>
              <CardDescription>{t('admin.customCodeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>{t('admin.customHeadHtml')}</Label>
                <Textarea
                  value={config.customHeadHtml || ''}
                  onChange={e => updateField('customHeadHtml', e.target.value)}
                  placeholder={t('admin.customHeadHtmlPlaceholder')}
                  rows={6}
                  className="mt-1.5 font-mono text-sm"
                />
                <p className="text-label-sm text-on-surface-variant/70 mt-1">
                  {t('admin.customHeadHtmlHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal">
          <div className="space-y-6">
            {/* Privacy Policy */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('admin.privacyPolicy')}</CardTitle>
                    <CardDescription>{t('admin.privacyPolicyDesc')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded border border-border overflow-hidden text-sm">
                      <Button
                        variant={privacyView === 'edit' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPrivacyView('edit')}
                        className="rounded-none px-3"
                      >{t('common.edit')}</Button>
                      <Button
                        variant={privacyView === 'preview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPrivacyView('preview')}
                        className="rounded-none px-3"
                      >{t('common.preview')}</Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePolicy('privacy')}
                      disabled={privacyGenerating}
                    >
                      <span className={`material-symbols-outlined text-[16px] text-primary ${privacyGenerating ? 'animate-spin' : ''}`} aria-hidden="true">{privacyGenerating ? 'progress_activity' : 'auto_awesome'}</span>
                      {privacyGenerating ? t('admin.generating') : t('admin.generateWithAI')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {privacyView === 'edit' ? (
                  <Textarea
                    value={config.privacyPolicyContent || ''}
                    onChange={e => updateField('privacyPolicyContent', e.target.value)}
                    placeholder={t('admin.privacyPolicyPlaceholder')}
                    rows={20}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="max-w-none p-4 bg-surface-container/40 border border-border rounded-lg min-h-[200px] text-body-sm text-on-surface leading-relaxed">
                    {config.privacyPolicyContent ? (
                      <ReactMarkdown>{config.privacyPolicyContent}</ReactMarkdown>
                    ) : (
                      <p className="text-on-surface-variant italic">{t('admin.noContentYet')}</p>
                    )}
                  </div>
                )}
                <p className="text-label-sm text-on-surface-variant/70 mt-2">
                  {t('admin.privacyPolicyHint')}
                </p>
              </CardContent>
            </Card>

            {/* Terms of Use */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('admin.termsOfUse')}</CardTitle>
                    <CardDescription>{t('admin.termsOfUseDesc')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded border border-border overflow-hidden text-sm">
                      <Button
                        variant={termsView === 'edit' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTermsView('edit')}
                        className="rounded-none px-3"
                      >{t('common.edit')}</Button>
                      <Button
                        variant={termsView === 'preview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTermsView('preview')}
                        className="rounded-none px-3"
                      >{t('common.preview')}</Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePolicy('terms')}
                      disabled={termsGenerating}
                    >
                      <span className={`material-symbols-outlined text-[16px] text-primary ${termsGenerating ? 'animate-spin' : ''}`} aria-hidden="true">{termsGenerating ? 'progress_activity' : 'auto_awesome'}</span>
                      {termsGenerating ? t('admin.generating') : t('admin.generateWithAI')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {termsView === 'edit' ? (
                  <Textarea
                    value={config.termsOfUseContent || ''}
                    onChange={e => updateField('termsOfUseContent', e.target.value)}
                    placeholder={t('admin.termsOfUsePlaceholder')}
                    rows={20}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="max-w-none p-4 bg-surface-container/40 border border-border rounded-lg min-h-[200px] text-body-sm text-on-surface leading-relaxed">
                    {config.termsOfUseContent ? (
                      <ReactMarkdown>{config.termsOfUseContent}</ReactMarkdown>
                    ) : (
                      <p className="text-on-surface-variant italic">{t('admin.noContentYet')}</p>
                    )}
                  </div>
                )}
                <p className="text-label-sm text-on-surface-variant/70 mt-2">
                  {t('admin.termsOfUseHint')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
