import type { Metadata } from "next";
import { getAuditById } from "@/lib/supabase";
import ShareReport from "./ShareReport";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAuditById(id);

  if (!audit) {
    return { title: "Audit Not Found — YouTube Producer" };
  }

  const title = `${audit.channel_title} — Channel Audit`;
  const description = `Data-backed analysis of ${audit.channel_title}'s YouTube channel. Performance tiers, title patterns, duration sweet spots, and AI recommendations.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://audit.youtubeproducer.app/share/${id}`,
      siteName: "YouTube Producer",
      images: [
        {
          url: audit.channel_thumbnail || "https://audit.youtubeproducer.app/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const audit = await getAuditById(id);

  if (!audit) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Audit not found</h1>
          <p className="text-sm text-stone-500 mb-4">This audit may have been removed or the link is invalid.</p>
          <a
            href="https://audit.youtubeproducer.app"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Run your own audit
          </a>
        </div>
      </div>
    );
  }

  return <ShareReport audit={audit} />;
}
