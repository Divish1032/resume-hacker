import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resume Hacker",
    short_name: "Resume Hacker",
    description: "Optimize your resume for ATS with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc", // slate-50
    theme_color: "#4f46e5", // indigo-600
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192 512x512",
        type: "image/png",
      }
    ],
  };
}
