import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@blog.com' },
    update: {},
    create: {
      email: 'admin@blog.com',
      username: 'admin',
      password: adminPassword,
      displayName: 'Admin',
      bio: 'Blog administrator',
      role: 'admin',
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@blog.com' },
    update: {},
    create: {
      email: 'user@blog.com',
      username: 'demo',
      password: userPassword,
      displayName: 'Demo User',
      bio: 'A blog author',
      role: 'user',
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'technology' }, update: {}, create: { name: 'Technology', slug: 'technology', description: 'Technology related posts', color: '#6366f1' } }),
    prisma.category.upsert({ where: { slug: 'lifestyle' }, update: {}, create: { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and personal development', color: '#ec4899' } }),
    prisma.category.upsert({ where: { slug: 'programming' }, update: {}, create: { name: 'Programming', slug: 'programming', description: 'Software development and coding', color: '#14b8a6' } }),
    prisma.category.upsert({ where: { slug: 'design' }, update: {}, create: { name: 'Design', slug: 'design', description: 'UI/UX design and creativity', color: '#f59e0b' } }),
    prisma.category.upsert({ where: { slug: 'ai' }, update: {}, create: { name: 'AI & ML', slug: 'ai', description: 'Artificial Intelligence and Machine Learning', color: '#8b5cf6' } }),
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'javascript' }, update: {}, create: { name: 'JavaScript', slug: 'javascript' } }),
    prisma.tag.upsert({ where: { slug: 'typescript' }, update: {}, create: { name: 'TypeScript', slug: 'typescript' } }),
    prisma.tag.upsert({ where: { slug: 'react' }, update: {}, create: { name: 'React', slug: 'react' } }),
    prisma.tag.upsert({ where: { slug: 'nestjs' }, update: {}, create: { name: 'NestJS', slug: 'nestjs' } }),
    prisma.tag.upsert({ where: { slug: 'nextjs' }, update: {}, create: { name: 'Next.js', slug: 'nextjs' } }),
    prisma.tag.upsert({ where: { slug: 'ai' }, update: {}, create: { name: 'AI', slug: 'ai' } }),
    prisma.tag.upsert({ where: { slug: 'tutorial' }, update: {}, create: { name: 'Tutorial', slug: 'tutorial' } }),
    prisma.tag.upsert({ where: { slug: 'webdev' }, update: {}, create: { name: 'Web Development', slug: 'webdev' } }),
  ]);

  // Create sample posts
  const posts = [
    {
      title: 'Getting Started with NestJS',
      slug: 'getting-started-with-nestjs',
      content: `<h2>What is NestJS?</h2>
<p>NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses TypeScript by default and combines elements of OOP, FP, and FRP.</p>

<h2>Why Choose NestJS?</h2>
<p>NestJS provides a robust architecture out of the box, with built-in support for dependency injection, modules, guards, interceptors, and more. It's inspired by Angular's architecture, making it familiar to many developers.</p>

<h2>Getting Started</h2>
<p>To get started with NestJS, install the CLI and create a new project:</p>
<pre><code>npm i -g @nestjs/cli\nnest new my-project</code></pre>
<p>This creates a new NestJS project with a well-organized structure including modules, controllers, and services.</p>

<h2>Key Features</h2>
<ul>
<li><strong>Modular Architecture</strong> - Organize your code into reusable modules</li>
<li><strong>Dependency Injection</strong> - Built-in DI container</li>
<li><strong>Decorators</strong> - Declarative programming with TypeScript decorators</li>
<li><strong>WebSockets</strong> - Built-in WebSocket support</li>
<li><strong>GraphQL</strong> - First-class GraphQL integration</li>
</ul>

<p>NestJS is an excellent choice for building production-ready applications with Node.js.</p>`,
      excerpt: 'Discover why NestJS is one of the most popular Node.js frameworks for building scalable server-side applications.',
      status: 'published',
      publishedAt: new Date(),
      categoryId: categories[2].id,
      authorId: admin.id,
      tagIds: [tags[0].id, tags[1].id, tags[3].id],
    },
    {
      title: 'The Rise of AI in Modern Web Development',
      slug: 'rise-of-ai-in-web-development',
      content: `<h2>AI is Transforming Web Development</h2>
<p>Artificial intelligence is reshaping how we build and interact with web applications. From code generation to intelligent user experiences, AI tools are becoming indispensable for modern developers.</p>

<h2>AI-Powered Development Tools</h2>
<p>Tools like GitHub Copilot, Claude, and ChatGPT are revolutionizing how developers write code. These AI assistants can generate code snippets, debug issues, and even write entire functions based on natural language descriptions.</p>

<h2>Intelligent User Experiences</h2>
<p>AI enables personalized user experiences through recommendation engines, chatbots, and dynamic content optimization. Machine learning models can analyze user behavior and adapt the interface accordingly.</p>

<h2>The Future</h2>
<p>As AI continues to evolve, we can expect even tighter integration between development workflows and intelligent assistance. The future of web development is not just about writing code — it's about collaborating with AI to create better applications faster.</p>`,
      excerpt: 'Explore how artificial intelligence is transforming web development, from code generation to intelligent user experiences.',
      status: 'published',
      publishedAt: new Date(),
      categoryId: categories[4].id,
      authorId: admin.id,
      tagIds: [tags[5].id, tags[7].id],
    },
    {
      title: 'Building Beautiful UIs with Tailwind CSS',
      slug: 'building-beautiful-uis-tailwind-css',
      content: `<h2>Why Tailwind CSS?</h2>
<p>Tailwind CSS has taken the web development world by storm. Unlike traditional CSS frameworks, Tailwind provides utility-first classes that allow you to build custom designs without leaving your HTML.</p>

<h2>Utility-First Approach</h2>
<p>Instead of pre-built components, Tailwind gives you low-level utility classes. This approach gives you complete control over your design while maintaining consistency.</p>

<h2>Key Benefits</h2>
<ul>
<li><strong>Rapid Prototyping</strong> - Build layouts quickly without writing custom CSS</li>
<li><strong>Consistent Design</strong> - Built-in design system with spacing, colors, and typography</li>
<li><strong>Responsive Design</strong> - Easy responsive modifiers for all screen sizes</li>
<li><strong>Performance</strong> - Purge unused CSS for tiny production bundles</li>
</ul>

<p>Tailwind CSS is perfect for developers who want to build beautiful, responsive interfaces quickly.</p>`,
      excerpt: 'Learn how Tailwind CSS can help you build beautiful, responsive user interfaces faster than ever before.',
      status: 'published',
      publishedAt: new Date(),
      categoryId: categories[3].id,
      authorId: user.id,
      tagIds: [tags[7].id],
    },
  ];

  for (const post of posts) {
    const tagIds = post.tagIds;
    const { tagIds: _, ...postData } = post;

    const created = await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: postData,
    });

    for (const tagId of tagIds) {
      await prisma.postTag.upsert({
        where: { postId_tagId: { postId: created.id, tagId } },
        update: {},
        create: { postId: created.id, tagId },
      });
    }
  }

  // Create sample comments
  const firstPost = await prisma.post.findFirst({ where: { slug: 'getting-started-with-nestjs' } });
  if (firstPost) {
    await prisma.comment.create({
      data: {
        content: 'Great article! Very helpful for beginners like me.',
        postId: firstPost.id,
        authorId: user.id,
        status: 'approved',
      },
    });
  }

  console.log('Seed data created successfully!');
  console.log('Admin login: admin / admin123');
  console.log('Demo login: demo / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
