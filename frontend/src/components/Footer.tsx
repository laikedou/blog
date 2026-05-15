import Link from 'next/link';

const CATEGORIES = [
  { href: '/category/technology', label: 'Technology' },
  { href: '/category/programming', label: 'Programming' },
  { href: '/category/design', label: 'Design' },
  { href: '/category/ai', label: 'AI &amp; ML' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cream-200 border-t border-border mt-auto" role="contentinfo">
      <div className="section-container py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="font-display text-display-sm text-ink mb-4">AI Blog</h3>
            <p className="text-body-sm text-ink-muted leading-relaxed max-w-xs">
              A modern personal blog platform powered by AI. Write smarter, publish faster.
            </p>
          </div>
          <nav aria-label="Quick links">
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-body text-ink-soft hover:text-clay transition-colors">Home</Link></li>
              <li><Link href="/login" className="text-body text-ink-soft hover:text-clay transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-body text-ink-soft hover:text-clay transition-colors">Register</Link></li>
            </ul>
          </nav>
          <nav aria-label="Categories">
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map(cat => (
                <li key={cat.href}>
                  <Link href={cat.href} className="text-body text-ink-soft hover:text-clay transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Support">
            <h3 className="text-caption text-ink tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-body text-ink-soft hover:text-clay transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="text-body text-ink-soft hover:text-clay transition-colors">Terms of Use</Link></li>
            </ul>
          </nav>
        </div>

        <div className="divider-wave mt-12 mb-6" aria-hidden="true" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-ink-muted">
            &copy; {currentYear} AI Blog. Built with Next.js &amp; NestJS.
          </p>
          <p className="text-caption-sm text-ink-muted tracking-wider uppercase">
            Warm Editorial Design
          </p>
        </div>
      </div>
    </footer>
  );
}
