import type { NextAuthConfig } from 'next-auth';

/**
* The authorized callback is used to verify if the request is authorized to access a page with Next.js Middleware. 
* It is called before a request is completed, and it receives an object with the auth and request properties. 
* The auth property contains the user's session, and the request property contains the incoming request.
*/
export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page

            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true; // Allow access to non-dashboard pages
        },
    },
    providers: [], // Add your authentication providers here
} satisfies NextAuthConfig;