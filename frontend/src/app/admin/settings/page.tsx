'use client';

import { useState, useEffect, useRef } from 'react';
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
      setSocialJsonError('Invalid JSON format');
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
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
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
        toast.success('Logo generated');
      } else {
        toast.error('AI image generation is not configured. Set GROK_API_KEY or CLOUDFLARE credentials in .env');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate logo');
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
        toast.success('Favicon generated (SVG)');
      } else {
        toast.error('AI generation is not configured. Set DEEPSEEK_API_KEY in .env');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate favicon');
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
        toast.success(`${type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'} generated successfully`);
      } else {
        toast.error('AI generation is not configured. Set DEEPSEEK_API_KEY in .env');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate policy content');
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (socialJsonError) {
      toast.error('Please fix the Social Links JSON before saving');
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
      toast.success('Site configuration saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-display-md text-ink mb-8">Settings</h1>
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
        <h1 className="font-display text-display-md text-ink">Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-2" />General</TabsTrigger>
          <TabsTrigger value="branding"><Paintbrush className="h-4 w-4 mr-2" />Branding</TabsTrigger>
          <TabsTrigger value="content"><FileText className="h-4 w-4 mr-2" />Content</TabsTrigger>
          <TabsTrigger value="seo"><Search className="h-4 w-4 mr-2" />SEO</TabsTrigger>
          <TabsTrigger value="footer"><Layout className="h-4 w-4 mr-2" />Footer</TabsTrigger>
          <TabsTrigger value="advanced"><Code className="h-4 w-4 mr-2" />Advanced</TabsTrigger>
          <TabsTrigger value="legal"><Shield className="h-4 w-4 mr-2" />Legal</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>Basic information about your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Site Title</label>
                <Input
                  value={config.siteTitle || ''}
                  onChange={e => updateField('siteTitle', e.target.value)}
                  placeholder="My Blog"
                />
                <p className="text-caption-sm text-ink-muted mt-1">Used in browser tabs, homepage heading, and as the default post title prefix.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Tagline</label>
                <Input
                  value={config.siteTagline || ''}
                  onChange={e => updateField('siteTagline', e.target.value)}
                  placeholder="Share knowledge, inspire thinking"
                />
                <p className="text-caption-sm text-ink-muted mt-1">A short phrase displayed below the site title on the homepage.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Site Description</label>
                <Textarea
                  value={config.siteDescription || ''}
                  onChange={e => updateField('siteDescription', e.target.value)}
                  placeholder="Describe what your blog is about..."
                  rows={3}
                />
                <p className="text-caption-sm text-ink-muted mt-1">Used in meta tags for search engines and social sharing.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Admin Panel Title</label>
                <Input
                  value={config.adminTitle || ''}
                  onChange={e => updateField('adminTitle', e.target.value)}
                  placeholder="Blog Admin"
                />
                <p className="text-caption-sm text-ink-muted mt-1">The title displayed in the admin navigation and top bar.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logos & Icons</CardTitle>
              <CardDescription>Customize your site visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Logo URL</label>
                <div className="flex gap-2">
                  <Input
                    value={config.logoUrl || ''}
                    onChange={e => updateField('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setLogoPickerOpen(true)} title="Browse media library">
                    <Image className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={logoUploading} title="Upload image">
                      {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input ref={logoFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('logoUrl', e.target.files?.[0]); if (logoFileRef.current) logoFileRef.current.value = ''; }} />
                  </label>
                  <Button type="button" variant="outline" onClick={handleGenerateLogo} disabled={logoGenerating} title="Generate logo with AI">
                    {logoGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-clay" />}
                  </Button>
                  {config.logoUrl && (
                    <Button type="button" variant="outline" onClick={() => updateField('logoUrl', '')} title="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-caption-sm text-ink-muted mt-1">Used in the header and admin sidebar.</p>
                {config.logoUrl && (
                  <div className="mt-3 p-3 bg-cream-300 rounded-editorial-xs inline-flex items-center gap-3">
                    <img src={config.logoUrl} alt="Logo preview" className="h-10 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-caption-sm text-ink-muted max-w-[200px] truncate">{config.logoUrl}</span>
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Favicon URL</label>
                <div className="flex gap-2">
                  <Input
                    value={config.faviconUrl || ''}
                    onChange={e => updateField('faviconUrl', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setFaviconPickerOpen(true)} title="Browse media library">
                    <Image className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={faviconUploading} title="Upload image">
                      {faviconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input ref={faviconFileRef} type="file" className="hidden" accept="image/*" onChange={e => { handleMediaUpload('faviconUrl', e.target.files?.[0]); if (faviconFileRef.current) faviconFileRef.current.value = ''; }} />
                  </label>
                  <Button type="button" variant="outline"  onClick={handleGenerateFavicon} disabled={faviconGenerating} title="Generate favicon with AI">
                    {faviconGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-clay" />}
                  </Button>
                </div>
                <p className="text-caption-sm text-ink-muted mt-1">Recommended: 32×32px ICO or PNG.</p>
                {config.faviconUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={config.faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain rounded border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
              <CardTitle>Reading & Discussion</CardTitle>
              <CardDescription>Control how content is displayed and how readers interact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Posts Per Page</label>
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
                <p className="text-caption-sm text-ink-muted mt-1">Number of posts to display on each page of the blog listing.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-body-sm font-medium text-ink mb-1">Enable Comments</label>
                  <p className="text-caption-sm text-ink-muted">Allow visitors to leave comments on your posts.</p>
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
              <CardTitle>Homepage SEO</CardTitle>
              <CardDescription>Customize how your homepage appears in search results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">SEO Title</label>
                <Input
                  value={config.seoHomeTitle || ''}
                  onChange={e => updateField('seoHomeTitle', e.target.value)}
                  placeholder="My Awesome Blog - Thoughts and Tutorials"
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  Custom title for the homepage in search results. Leave empty to use the Site Title.
                  <span className="block mt-1 text-clay font-medium">
                    Preview: {config.seoHomeTitle || config.siteTitle || 'AI Blog'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">SEO Description</label>
                <Textarea
                  value={config.seoHomeDescription || ''}
                  onChange={e => updateField('seoHomeDescription', e.target.value)}
                  placeholder="Discover in-depth tutorials about web development, AI, and more..."
                  rows={3}
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  Meta description for the homepage. Appears under the title in Google search results. Recommended: 150–160 characters.
                  <span className="block mt-1 text-caption-sm">
                    Current: <span className={((config.seoHomeDescription || '').length > 160) ? 'text-red-500' : 'text-ink-muted'}>{config.seoHomeDescription?.length || 0} characters</span>
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
              <CardTitle>Footer & Contact</CardTitle>
              <CardDescription>Information displayed in the site footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Footer Text</label>
                <Input
                  value={config.footerText || ''}
                  onChange={e => updateField('footerText', e.target.value)}
                  placeholder="Built with AI Blog"
                />
                <p className="text-caption-sm text-ink-muted mt-1">Additional text displayed in the footer area.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Copyright Text</label>
                <Input
                  value={config.copyrightText || ''}
                  onChange={e => updateField('copyrightText', e.target.value)}
                  placeholder={`© ${new Date().getFullYear()} My Blog. All rights reserved.`}
                />
                <p className="text-caption-sm text-ink-muted mt-1">Copyright notice displayed in the footer.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Contact Email</label>
                <Input
                  type="email"
                  value={config.contactEmail || ''}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  placeholder="hello@example.com"
                />
                <p className="text-caption-sm text-ink-muted mt-1">Public contact email displayed on the site.</p>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Social Links (JSON)</label>
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
                  JSON object with social media URLs. Example: <code className="text-clay">{'{ "twitter": "https://twitter.com/...", "github": "https://github.com/...", "linkedin": "https://linkedin.com/in/..." }'}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Code</CardTitle>
              <CardDescription>Inject custom HTML into the &lt;head&gt; section (analytics, fonts, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-ink mb-1.5">Custom Head HTML</label>
                <Textarea
                  value={config.customHeadHtml || ''}
                  onChange={e => updateField('customHeadHtml', e.target.value)}
                  placeholder="<!-- Google Analytics, custom fonts, etc. -->"
                  rows={6}
                  className="font-mono text-body-sm"
                />
                <p className="text-caption-sm text-ink-muted mt-1">
                  HTML injected at the end of the <code className="text-clay">&lt;head&gt;</code> tag on every page. Use for analytics scripts, custom fonts, verification tags, etc.
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
                  <CardTitle>Privacy Policy</CardTitle>
                  <CardDescription>Edit the privacy policy displayed at /privacy-policy. Supports Markdown formatting.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-editorial-xs border border-border overflow-hidden text-body-sm">
                    <button
                      type="button"
                      onClick={() => setPrivacyView('edit')}
                      className={`px-3 py-1.5 transition-colors ${privacyView === 'edit' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >Edit</button>
                    <button
                      type="button"
                      onClick={() => setPrivacyView('preview')}
                      className={`px-3 py-1.5 transition-colors ${privacyView === 'preview' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >Preview</button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePolicy('privacy')}
                    disabled={privacyGenerating}
                  >
                    {privacyGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1 text-clay" />}
                    {privacyGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {privacyView === 'edit' ? (
                <Textarea
                  value={config.privacyPolicyContent || ''}
                  onChange={e => updateField('privacyPolicyContent', e.target.value)}
                  placeholder="Write your privacy policy in Markdown..."
                  rows={20}
                  className="font-mono text-body-sm"
                />
              ) : (
                <div className="prose-custom max-w-none p-4 bg-cream-100 rounded-editorial-xs border border-border min-h-[200px]">
                  {config.privacyPolicyContent ? (
                    <ReactMarkdown>{config.privacyPolicyContent}</ReactMarkdown>
                  ) : (
                    <p className="text-ink-muted italic">No content yet. Switch to Edit mode to start writing, or generate with AI.</p>
                  )}
                </div>
              )}
              <p className="text-caption-sm text-ink-muted mt-2">
                This content is displayed on the <code className="text-clay">/privacy-policy</code> page. Visitors can access it from the footer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Terms of Use</CardTitle>
                  <CardDescription>Edit the terms of use displayed at /terms-of-use. Supports Markdown formatting.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-editorial-xs border border-border overflow-hidden text-body-sm">
                    <button
                      type="button"
                      onClick={() => setTermsView('edit')}
                      className={`px-3 py-1.5 transition-colors ${termsView === 'edit' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >Edit</button>
                    <button
                      type="button"
                      onClick={() => setTermsView('preview')}
                      className={`px-3 py-1.5 transition-colors ${termsView === 'preview' ? 'bg-clay text-white' : 'bg-cream-100 text-ink-muted hover:text-ink'}`}
                    >Preview</button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePolicy('terms')}
                    disabled={termsGenerating}
                  >
                    {termsGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1 text-clay" />}
                    {termsGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {termsView === 'edit' ? (
                <Textarea
                  value={config.termsOfUseContent || ''}
                  onChange={e => updateField('termsOfUseContent', e.target.value)}
                  placeholder="Write your terms of use in Markdown..."
                  rows={20}
                  className="font-mono text-body-sm"
                />
              ) : (
                <div className="prose-custom max-w-none p-4 bg-cream-100 rounded-editorial-xs border border-border min-h-[200px]">
                  {config.termsOfUseContent ? (
                    <ReactMarkdown>{config.termsOfUseContent}</ReactMarkdown>
                  ) : (
                    <p className="text-ink-muted italic">No content yet. Switch to Edit mode to start writing, or generate with AI.</p>
                  )}
                </div>
              )}
              <p className="text-caption-sm text-ink-muted mt-2">
                This content is displayed on the <code className="text-clay">/terms-of-use</code> page. Visitors can access it from the footer.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
