const pool = require('../config/database')

async function migrate() {
  try {
    console.log('🚀 Starting database migration...')

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Users table created')

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Categories table created')

    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Items table created')

    // Create ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id, category_id)
      )
    `)
    console.log('✅ Ratings table created')

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ratings_item_id ON ratings(item_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ratings_category_id ON ratings(category_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at)')
    console.log('✅ Indexes created')

    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)

    // Create triggers for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
      CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_items_updated_at ON items;
      CREATE TRIGGER update_items_updated_at
        BEFORE UPDATE ON items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
      CREATE TRIGGER update_ratings_updated_at
        BEFORE UPDATE ON ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)
    console.log('✅ Triggers created')

    console.log('🎉 Database migration completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate() 