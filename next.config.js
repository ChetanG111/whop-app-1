/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['picsum.photos'],
    },
    // Transpile problematic packages to prevent webpack vendor chunk issues
    transpilePackages: ['frosted-ui', '@frosted-ui/colors', '@whop/sdk', '@whop/react'],

    // Allow embedding in Whop iframe
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/:path*',
                headers: [
                    {
                        // Remove X-Frame-Options to allow iframe embedding
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        // Set Content-Security-Policy to allow framing by Whop
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://*.whop.com https://whop.com;",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
