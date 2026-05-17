'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig as siteConfigApi, media as mediaApi, ai as aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Globe, Paintbrush, FileText, Search, Layout, Code, Image, Upload, Loader2, X, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import ReactMarkdown from 'react-markdown';

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

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-display-md text-ink mb-8">{t('admin.settings')}</h1>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-display-md text-ink">{t('admin.settings')}</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('admin.saving') : t('admin.saveSettings')}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-2" />{t('admin.general')}</TabsTrigger>
          <TabsTrigger value="branding"><Paintbrush className="h-4 w-4 mr-2" />{t('admin.branding')}</TabsTrigger>
          <TabsTrigger value="content"><FileText className="h-4 w-4 mr-2" />{t('admin.contentSettings')}</TabsTrigger>
          <TabsTrigger value="seo"><Search className="h-4 w-4 mr-2" />{t('admin.seo')}</TabsTrigger>
          <TabsTrigger value="footer"><Layout className="h-4 w-4 mr-2" />{t('admin.footer')}</TabsTrigger>
          <TabsTrigger value="advanced"><Code className="h-4 w-4 mr-2" />{t('admin.advanced')}</TabsTrigger>
          <TabsTrigger value="legal"><Shield className="h-4 w-4 mr-2" />{t('admin.legal')}</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.siteIdentity')}</CardTitle>
              <CardDescription>{t('admin.siteIdentityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.siteTitle')}</label>
                <Input
                  value={config.siteTitle || ''}
                  onChange={e => updateField('siteTitle', e.target.value)}
                  placeholder={t('admin.siteTitlePlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.siteTitleHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.tagline')}</label>
                <Input
                  value={config.siteTagline || ''}
                  onChange={e => updateField('siteTagline', e.target.value)}
                  placeholder={t('admin.taglinePlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.taglineHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.siteDescription')}</label>
                <Textarea
                  value={config.siteDescription || ''}
                  onChange={e => updateField('siteDescription', e.target.value)}
                  placeholder={t('admin.siteDescriptionPlaceholder')}
                  rows={3}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.siteDescriptionHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.adminTitle')}</label>
                <Input
                  value={config.adminTitle || ''}
                  onChange={e => updateField('adminTitle', e.target.value)}
                  placeholder={t('admin.adminTitlePlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.adminTitleHint')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.logosIcons')}</CardTitle>
              <CardDescription>{t('admin.logosIconsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.logoUrl')}</label>
                <div className="flex gap-2">
                  <Input
                    value={config.logoUrl || ''}
                    onChange={e => updateField('logoUrl', e.target.value)}
                    placeholder={t('admin.logoUrlPlaceholder')}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setLogoPickerOpen(true)} title={t('admin.browseMedia')}>
                    <Image className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={logoUploading} title={t('admin.uploadImage')}>
                      {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input ref={logoFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('logoUrl', e.target.files?.[0]); if (logoFileRef.current) logoFileRef.current.value = ''; }} />
                  </label>
                  <Button type="button" variant="outline" onClick={handleGenerateLogo} disabled={logoGenerating} title={t('admin.generateLogoAI')}>
                    {logoGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-clay" />}
                  </Button>
                  {config.logoUrl && (
                    <Button type="button" variant="outline" onClick={() => updateField('logoUrl', '')} title={t('admin.remove')}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.logoHint')}</p>
                {config.logoUrl && (
                  <div className="mt-3 p-3 bg-cream-300 rounded-editorial-xs inline-flex items-center gap-3">
                    <img src={config.logoUrl} alt={t('admin.logoPreview')} className="h-10 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-caption-sm text-ink-muted max-w-[200px] truncate">{config.logoUrl}</span>
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.faviconUrl')}</label>
                <div className="flex gap-2">
                  <Input
                    value={config.faviconUrl || ''}
                    onChange={e => updateField('faviconUrl', e.target.value)}
                    placeholder={t('admin.faviconUrlPlaceholder')}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setFaviconPickerOpen(true)} title={t('admin.browseMedia')}>
                    <Image className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={faviconUploading} title={t('admin.uploadImage')}>
                      {faviconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input ref={faviconFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('faviconUrl', e.target.files?.[0]); if (faviconFileRef.current) faviconFileRef.current.value = ''; }} />
                  </label>
                  <Button type="button" variant="outline"  onClick={handleGenerateFavicon} disabled={faviconGenerating} title={t('admin.generateFaviconAI')}>
                    {faviconGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-clay" />}
                  </Button>
                </div>
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.faviconHint')}</p>
                {config.faviconUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={config.faviconUrl} alt={t('admin.faviconPreview')} className="w-8 h-8 object-contain rounded border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-caption-sm text-ink-muted max-w-[200px] truncate">{config.faviconUrl}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <MediaPickerDialog open={logoPickerOpen} onOpenChange={setLogoPickerOpen} onSelect={url => updateField('logoUrl', url)} />
          <MediaPickerDialog open={faviconPickerOpen} onOpenChange={setFaviconPickerOpen} onSelect={url => updateField('faviconUrl', url)} />
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.readingDiscussion')}</CardTitle>
              <CardDescription>{t('admin.readingDiscussionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.postsPerPage')}</label>
                <Select
                  value={String(config.postsPerPage || 10)}
                  onValueChange={v => updateField('postsPerPage', Number(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25, 30, 50].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.postsPerPageHint')}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-body-sm font-medium text-ink mb-1">{t('admin.enableComments')}</label>
                  <p className="text-caption-sm text-ink-muted">{t('admin.enableCommentsHint')}</p>
                </div>
                <Switch
                  checked={config.enableComments !== false}
                  onCheckedChange={v => updateField('enableComments', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.homepageSEO')}</CardTitle>
              <CardDescription>{t('admin.homepageSEODesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.seoTitle')}</label>
                <Input
                  value={config.seoHomeTitle || ''}
                  onChange={e => updateField('seoHomeTitle', e.target.value)}
                  placeholder={t('admin.seoTitlePlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  {t('admin.seoTitleHint')}
                  <span className="block mt-1 text-clay font-medium">
                    {t('admin.preview')}: {config.seoHomeTitle || config.siteTitle || 'AI Blog'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.seoDescription')}</label>
                <Textarea
                  value={config.seoHomeDescription || ''}
                  onChange={e => updateField('seoHomeDescription', e.target.value)}
                  placeholder={t('admin.seoDescriptionPlaceholder')}
                  rows={3}
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  {t('admin.seoDescriptionHint')}
                  <span className="block mt-1 text-caption-sm">
                    {t('admin.current')}: <span className={((config.seoHomeDescription || '').length > 160) ? 'text-red-500' : 'text-ink-muted'}>{config.seoHomeDescription?.length || 0} {t('admin.characters')}</span>
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.footerContact')}</CardTitle>
              <CardDescription>{t('admin.footerContactDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.footerText')}</label>
                <Input
                  value={config.footerText || ''}
                  onChange={e => updateField('footerText', e.target.value)}
                  placeholder={t('admin.footerTextPlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.footerTextHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.copyrightText')}</label>
                <Input
                  value={config.copyrightText || ''}
                  onChange={e => updateField('copyrightText', e.target.value)}
                  placeholder={`© ${new Date().getFullYear()} ${t('admin.copyrightPlaceholder')}`}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.copyrightTextHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.contactEmail')}</label>
                <Input
                  type="email"
                  value={config.contactEmail || ''}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  placeholder={t('admin.contactEmailPlaceholder')}
                />
                <p className="text-caption-sm text-ink-muted mt-1">{t('admin.contactEmailHint')}</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.socialLinks')}</label>
                <Textarea
                  value={socialLinksText}
                  onChange={e => handleSocialLinksChange(e.target.value)}
                  rows={4}
                  className="font-mono text-body-sm"
                />
                {socialJsonError && (
                  <p className="text-caption-sm text-red-500 mt-1">{socialJsonError}</p>
                )}
                <p className="text-caption-sm text-ink-muted mt-1">
                  {t('admin.socialLinksHint')} <code className="text-clay">{'{ "twitter": "https://twitter.com/...", "github": "https://github.com/...", "linkedin": "https://linkedin.com/in/..." }'}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.customCode')}</CardTitle>
              <CardDescription>{t('admin.customCodeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">{t('admin.customHeadHtml')}</label>
                <Textarea
                  value={config.customHeadHtml || ''}
                  onChange={e => updateField('customHeadHtml', e.target.value)}
                  placeholder={t('admin.customHeadHtmlPlaceholder')}
                  rows={6}
                  className="font-mono text-body-sm"
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  {t('admin.customHeadHtmlHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal */}
        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('admin.privacyPolicy')}</CardTitle>
                  <CardDescription>{t('admin.privacyPolicyDesc')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-editorial-xs border border-border overflow-hidden text-body-sm">
                    <button
                      type="button"
                      onClick={() => setPrivacyView('edit')}
                      className={`px-3 py-1.5 transition-colors ${privacyView === 'edit' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >{t('common.edit')}</button>
                    <button
                      type="button"
                      onClick={() => setPrivacyView('preview')}
                      className={`px-3 py-1.5 transition-colors ${privacyView === 'preview' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >{t('common.preview')}</button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePolicy('privacy')}
                    disabled={privacyGenerating}
                  >
                    {privacyGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1 text-clay" />}
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
                  className="font-mono text-body-sm"
                />
              ) : (
                <div className="prose-custom max-w-none p-4 bg-cream-100 rounded-editorial-xs border border-border min-h-[200px]">
                  {config.privacyPolicyContent ? (
                    <ReactMarkdown>{config.privacyPolicyContent}</ReactMarkdown>
                  ) : (
                    <p className="text-ink-muted italic">{t('admin.noContentYet')}</p>
                  )}
                </div>
              )}
              <p className="text-caption-sm text-ink-muted mt-2">
                {t('admin.privacyPolicyHint')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('admin.termsOfUse')}</CardTitle>
                  <CardDescription>{t('admin.termsOfUseDesc')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-editorial-xs border border-border overflow-hidden text-body-sm">
                    <button
                      type="button"
                      onClick={() => setTermsView('edit')}
                      className={`px-3 py-1.5 transition-colors ${termsView === 'edit' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >{t('common.edit')}</button>
                    <button
                      type="button"
                      onClick={() => setTermsView('preview')}
                      className={`px-3 py-1.5 transition-colors ${termsView === 'preview' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >{t('common.preview')}</button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePolicy('terms')}
                    disabled={termsGenerating}
                  >
                    {termsGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1 text-clay" />}
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
                  className="font-mono text-body-sm"
                />
              ) : (
                <div className="prose-custom max-w-none p-4 bg-cream-100 rounded-editorial-xs border border-border min-h-[200px]">
                  {config.termsOfUseContent ? (
                    <ReactMarkdown>{config.termsOfUseContent}</ReactMarkdown>
                  ) : (
                    <p className="text-ink-muted italic">{t('admin.noContentYet')}</p>
                  )}
                </div>
              )}
              <p className="text-caption-sm text-ink-muted mt-2">
                {t('admin.termsOfUseHint')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
