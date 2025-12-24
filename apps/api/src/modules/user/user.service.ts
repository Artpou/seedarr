import { db, eq } from "@/db/db";
import { NewUser, User, user } from "@/db/schema";

export class UserService {
  async getById(id: string): Promise<User | null> {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });
    return foundUser ?? null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    return foundUser ?? null;
  }

  async getAll(): Promise<User[]> {
    return await db.query.user.findMany();
  }

  async create(data: NewUser): Promise<User> {
    const [createdUser] = await db.insert(user).values(data).returning();
    return createdUser;
  }

  async update(id: string, data: Partial<Omit<NewUser, "id" | "createdAt">>): Promise<User | null> {
    const [updatedUser] = await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();
    return updatedUser ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const [deleted] = await db.delete(user).where(eq(user.id, id)).returning();
    return deleted !== undefined;
  }
}

export const userService = new UserService();
