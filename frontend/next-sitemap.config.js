/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yourdomain.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'Baiduspider', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://yourdomain.com'}/server-sitemap.xml`,
    ],
  },
  exclude: [
    '/admin/*',
    '/login',
    '/register',
    '/api/*',
  ],
  generateIndexSitemap: false,
  outDir: './public',
  changefreq: 'weekly',
  priority: 0.7,
  transform: async (config, path) => {
    // Custom priority mapping
    const priorityMap = {
      '/': 1.0,
    };
    if (path.startsWith('/posts/')) return { loc: path, changefreq: 'weekly', priority: 0.8, lastmod: config.autoLastmod ? new Date().toISOString() : undefined };
    if (path.startsWith('/category/')) return { loc: path, changefreq: 'weekly', priority: 0.6 };
    if (path.startsWith('/tag/')) return { loc: path, changefreq: 'weekly', priority: 0.5 };
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priorityMap[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
