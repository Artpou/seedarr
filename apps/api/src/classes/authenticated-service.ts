import { Context } from "hono";

import { HonoVariables } from "@/types/hono";
import type { User } from "../modules/user/user.dto";

export abstract class AuthenticatedService {
  protected readonly user: User;

  constructor(user: User) {
    this.user = user;
  }

  static fromContext<T extends AuthenticatedService>(
    this: new (
      user: User,
    ) => T,
    c: Context<{ Variables: HonoVariables }>,
  ): T {
    return new this(c.get("user"));
  }
}
