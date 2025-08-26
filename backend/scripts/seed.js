const pool = require('../config/database')
const bcrypt = require('bcryptjs')

async function seed() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)
    const adminResult = await pool.query(`
      INSERT INTO users (username, password_hash, is_admin) 
      VALUES ('admin', $1, true) 
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, [adminPassword])

    let adminId
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].id
      console.log('✅ Admin user created')
    } else {
      const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', ['admin'])
      adminId = existingAdmin.rows[0].id
      console.log('✅ Admin user already exists')
    }

    // Create sample categories
    const categories = [
      { name: 'Aroma', description: 'Intensidad y calidad del aroma' },
      { name: 'Sabor', description: 'Complejidad y balance del sabor' },
      { name: 'Cuerpo', description: 'Peso y textura en boca' },
      { name: 'Acidez', description: 'Brillo y frescura' },
      { name: 'Final', description: 'Persistencia y calidad del retrogusto' }
    ]

    for (const category of categories) {
      await pool.query(`
        INSERT INTO categories (name, description) 
        VALUES ($1, $2) 
        ON CONFLICT (name) DO NOTHING
      `, [category.name, category.description])
    }
    console.log('✅ Sample categories created')

    // Create sample items
    const items = [
      { 
        name: 'Vino Tinto Reserva 2018', 
        description: 'Vino tinto añejado en barricas de roble con notas de frutos rojos y especias',
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'
      },
      { 
        name: 'Cerveza Artesanal IPA', 
        description: 'India Pale Ale con lúpulo aromático y amargor equilibrado',
        image_url: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400'
      },
      { 
        name: 'Whisky Single Malt 12 Años', 
        description: 'Whisky escocés de malta única con notas de vainilla y frutos secos',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
      },
      { 
        name: 'Café Especialidad Colombiano', 
        description: 'Café de altura con notas de chocolate negro y frutos rojos',
        image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'
      },
      { 
        name: 'Aceite de Oliva Virgen Extra', 
        description: 'Aceite de oliva de primera prensada con notas herbáceas y frutales',
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'
      }
    ]

    for (const item of items) {
      await pool.query(`
        INSERT INTO items (name, description, image_url) 
        VALUES ($1, $2, $3) 
        ON CONFLICT DO NOTHING
      `, [item.name, item.description, item.image_url])
    }
    console.log('✅ Sample items created')

    // Create some sample users
    const sampleUsers = [
      { username: 'catador1', password: 'password123' },
      { username: 'catador2', password: 'password123' },
      { username: 'expert', password: 'password123' }
    ]

    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12)
      await pool.query(`
        INSERT INTO users (username, password_hash) 
        VALUES ($1, $2) 
        ON CONFLICT (username) DO NOTHING
      `, [user.username, hashedPassword])
    }
    console.log('✅ Sample users created')

    // Get category and item IDs for sample ratings
    const categoryResult = await pool.query('SELECT id FROM categories ORDER BY name LIMIT 3')
    const itemResult = await pool.query('SELECT id FROM items ORDER BY name LIMIT 3')
    const userResult = await pool.query('SELECT id FROM users WHERE username != $1 LIMIT 3', ['admin'])

    if (categoryResult.rows.length > 0 && itemResult.rows.length > 0 && userResult.rows.length > 0) {
      // Create some sample ratings
      const categories = categoryResult.rows
      const items = itemResult.rows
      const users = userResult.rows

      for (const user of users) {
        for (const item of items) {
          for (const category of categories) {
            const stars = Math.floor(Math.random() * 5) + 1
            await pool.query(`
              INSERT INTO ratings (user_id, item_id, category_id, stars) 
              VALUES ($1, $2, $3, $4) 
              ON CONFLICT DO NOTHING
            `, [user.id, item.id, category.id, stars])
          }
        }
      }
      console.log('✅ Sample ratings created')
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Sample data created:')
    console.log('- Admin user: admin / admin123')
    console.log('- Sample users: catador1, catador2, expert (password: password123)')
    console.log('- 5 categories (Aroma, Sabor, Cuerpo, Acidez, Final)')
    console.log('- 5 sample items with images')
    console.log('- Sample ratings for demonstration')
    
    process.exit(0)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed() 