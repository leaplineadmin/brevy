#!/usr/bin/env node

// Script simple pour supprimer un utilisateur
// Usage: node delete-user-simple.js <email>

const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/cvfolio',
  ssl: false
});

async function deleteUser(email) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}`);
    
    // Trouver l'utilisateur par email
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Utilisateur trouvé: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    
    // Supprimer tous les CVs de l'utilisateur
    console.log('🗑️  Suppression des CVs...');
    await client.query('DELETE FROM cv_drafts WHERE user_id = $1', [user.id]);
    console.log('✅ CVs supprimés');
    
    // Supprimer l'utilisateur
    console.log('🗑️  Suppression de l\'utilisateur...');
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('✅ Utilisateur supprimé avec succès');
    
    console.log(`🎉 Compte ${email} supprimé complètement de la base de données`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.log('❌ Veuillez fournir un email: node delete-user-simple.js <email>');
  process.exit(1);
}

deleteUser(email);
