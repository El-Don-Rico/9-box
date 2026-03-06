import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        "/dashboard",
        "/employees",
        "/assessments",
        "/self-assessment",
        "/my-results",
        "/assess",
        "/team",
        "/calibration",
        "/nine-box",
        "/admin",
        "/summary",
      ];
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register" || nextUrl.pathname === "/")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [],
};
