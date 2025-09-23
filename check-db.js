const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/home/z/my-project/db/custom.db'
    }
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check Users
    const users = await prisma.user.findMany();
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    
    // Check Posts
    const posts = await prisma.post.findMany();
    console.log(`📝 Posts: ${posts.length}`);
    posts.forEach(post => {
      console.log(`  - ${post.title} (published: ${post.published})`);
    });
    
    // Check Plugins
    const plugins = await prisma.plugin.findMany();
    console.log(`🔌 Plugins: ${plugins.length}`);
    plugins.forEach(plugin => {
      console.log(`  - ${plugin.name} v${plugin.version} (active: ${plugin.isActive})`);
    });
    
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();