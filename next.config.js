/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['picsum.photos'],
    },
    // Transpile problematic packages to prevent webpack vendor chunk issues
    transpilePackages: ['frosted-ui', '@frosted-ui/colors', '@whop/sdk', '@whop/react'],
};

module.exports = nextConfig;
