import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@whop/react/**/*.{js,ts,jsx,tsx}",
		"./app/app-components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	plugins: [],
};

export default config;
