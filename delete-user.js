#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users, cvDrafts } from './shared/schema.js';

// Configuration de la base de données
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/cvfolio';
const client = postgres(connectionString);
const db = drizzle(client);

async function deleteUser(email) {
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}`);
    
    // Trouver l'utilisateur par email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    const userId = user[0].id;
    console.log(`✅ Utilisateur trouvé: ${user[0].firstName} ${user[0].lastName} (ID: ${userId})`);
    
    // Supprimer tous les CVs de l'utilisateur
    console.log('🗑️  Suppression des CVs...');
    const deletedCVs = await db.delete(cvDrafts).where(eq(cvDrafts.userId, userId));
    console.log(`✅ CVs supprimés`);
    
    // Supprimer l'utilisateur
    console.log('🗑️  Suppression de l\'utilisateur...');
    await db.delete(users).where(eq(users.id, userId));
    console.log('✅ Utilisateur supprimé avec succès');
    
    console.log(`🎉 Compte ${email} supprimé complètement de la base de données`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    await client.end();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.log('❌ Veuillez fournir un email: node delete-user.js <email>');
  process.exit(1);
}

deleteUser(email);
