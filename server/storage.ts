import {
  users,
  cvs,
  deletedUsers,
  type User,
  type UpsertUser,
  type CV,
  type InsertCV,
  type DeletedUser,
  type InsertDeletedUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, isNotNull, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: { username: string; password: string; email: string; firstName: string; lastName: string }): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Suppression différée
  createDeletedUserRecord(user: User): Promise<DeletedUser>;
  getDeletedUserByEmail(email: string): Promise<DeletedUser | undefined>;
  
  // Stripe operations
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateSubscriptionStatus(userId: string, hasActiveSubscription: boolean): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  setUserSubscriptionStatus(userId: string, hasActiveSubscription: boolean): Promise<User>;
  
  // CV operations
  getCVsByUserId(userId: string): Promise<CV[]>;
  getCVById(id: string): Promise<CV | undefined>;
  createCV(cv: Omit<InsertCV, 'id'> & { id?: string }): Promise<CV>;
  updateCV(id: string, cvData: Partial<CV>): Promise<CV>;
  deleteCV(id: string): Promise<void>;
  getCVBySubdomain(subdomain: string): Promise<CV | undefined>;
  getUserCVWithSubdomain(userId: string): Promise<CV | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // First unpublish all user's CVs to free up subdomains
    await db
      .update(cvs)
      .set({ 
        subdomain: null, 
        isPublished: false, 
        publishedAt: null 
      })
      .where(eq(cvs.userId, id));
    
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async createUser(userData: { 
    username: string; 
    password?: string; 
    email: string; 
    firstName: string; 
    lastName: string;
    googleId?: string;
    profileImageUrl?: string;
  }): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        id,
        username: userData.username,
        password: userData.password || null,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        googleId: userData.googleId || null,
        profileImageUrl: userData.profileImageUrl || null,
      })
      .returning();
    return user;
  }

  // Suppression différée
  async createDeletedUserRecord(user: User): Promise<DeletedUser> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10); // 10 jours à partir de maintenant
    
    const deletedUserData: InsertDeletedUser = {
      id: `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalUserId: user.id,
      email: user.email!,
      firstName: user.firstName!,
      lastName: user.lastName!,
      expiresAt,
    };
    
    const [deletedUser] = await db
      .insert(deletedUsers)
      .values(deletedUserData)
      .returning();
    
    return deletedUser;
  }

  async getDeletedUserByEmail(email: string): Promise<DeletedUser | undefined> {
    const [deletedUser] = await db
      .select()
      .from(deletedUsers)
      .where(eq(deletedUsers.email, email));
    return deletedUser;
  }

  // CV operations
  async getCVsByUserId(userId: string): Promise<CV[]> {
    const userCVs = await db.select().from(cvs).where(eq(cvs.userId, userId));
    return userCVs;
  }

  async getCVById(id: string): Promise<CV | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.id, id));
    return cv;
  }

  async createCV(cvData: Omit<InsertCV, 'id'> & { id?: string }): Promise<CV> {
    const id = cvData.id || `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [cv] = await db
      .insert(cvs)
      .values({
        ...cvData,
        id,
      })
      .returning();
    return cv;
  }

  async updateCV(id: string, cvData: Partial<CV>): Promise<CV> {
    const [cv] = await db
      .update(cvs)
      .set({ ...cvData, updatedAt: new Date() })
      .where(eq(cvs.id, id))
      .returning();
    return cv;
  }

  async deleteCV(id: string): Promise<void> {
    await db.delete(cvs).where(eq(cvs.id, id));
  }

  async getCVBySubdomain(subdomain: string): Promise<CV | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.subdomain, subdomain));
    return cv;
  }

  async getUserCVWithSubdomain(userId: string): Promise<CV | undefined> {
    const [cv] = await db
      .select()
      .from(cvs)
      .where(and(
        eq(cvs.userId, userId),
        isNotNull(cvs.subdomain),
        eq(cvs.isPublished, true)
      ));
    return cv;
  }

  // Stripe operations
  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        // Don't activate subscription until webhook confirms payment
        hasActiveSubscription: false,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, hasActiveSubscription: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        hasActiveSubscription,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async setUserSubscriptionStatus(userId: string, hasActiveSubscription: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        hasActiveSubscription,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

}

export const storage = new DatabaseStorage();