export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/customers/:path*",
    "/products-services/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};

