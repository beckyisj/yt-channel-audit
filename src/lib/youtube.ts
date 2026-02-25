const API_KEY = process.env.YOUTUBE_API_KEY!;
const BASE = "https://www.googleapis.com/youtube/v3";

export interface ChannelInfo {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  customUrl?: string;
  publishedAt?: string;
}

export interface VideoData {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnail: string;
  duration?: string;
  durationSeconds: number;
  isShort: boolean;
  tags?: string[];
  description?: string;
}

// Resolve a channel from URL, handle, or name
export async function resolveChannel(input: string): Promise<ChannelInfo> {
  const trimmed = input.trim();

  let identifier = trimmed;
  const urlMatch = trimmed.match(
    /youtube\.com\/(?:@([\w.-]+)|channel\/(UC[\w-]+)|c\/([\w.-]+)|user\/([\w.-]+))/i
  );
  if (urlMatch) {
    if (urlMatch[1]) identifier = `@${urlMatch[1]}`;
    else if (urlMatch[2]) identifier = urlMatch[2];
    else if (urlMatch[3]) identifier = urlMatch[3];
    else if (urlMatch[4]) identifier = urlMatch[4];
  }

  if (identifier.startsWith("UC") && identifier.length === 24) {
    return fetchChannelById(identifier);
  }

  if (identifier.startsWith("@")) {
    return fetchChannelByHandle(identifier);
  }

  try {
    return await fetchChannelByHandle(`@${identifier}`);
  } catch {
    return searchForChannel(identifier);
  }
}

async function fetchChannelById(channelId: string): Promise<ChannelInfo> {
  const url = `${BASE}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items?.length) throw new Error("Channel not found");
  return mapChannelItem(data.items[0]);
}

async function fetchChannelByHandle(handle: string): Promise<ChannelInfo> {
  const url = `${BASE}/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle.replace("@", ""))}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items?.length) throw new Error("Channel not found");
  return mapChannelItem(data.items[0]);
}

async function searchForChannel(query: string): Promise<ChannelInfo> {
  const url = `${BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=1&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items?.length) throw new Error("Channel not found");
  const channelId = data.items[0].snippet.channelId;
  return fetchChannelById(channelId);
}

function mapChannelItem(item: Record<string, unknown>): ChannelInfo {
  const snippet = item.snippet as Record<string, unknown>;
  const statistics = item.statistics as Record<string, string>;
  const thumbnails = snippet.thumbnails as Record<string, { url: string }>;
  return {
    channelId: item.id as string,
    title: snippet.title as string,
    description: snippet.description as string,
    thumbnail: thumbnails?.medium?.url || thumbnails?.default?.url || "",
    subscriberCount: parseInt(statistics.subscriberCount || "0", 10),
    viewCount: parseInt(statistics.viewCount || "0", 10),
    videoCount: parseInt(statistics.videoCount || "0", 10),
    customUrl: snippet.customUrl as string | undefined,
    publishedAt: snippet.publishedAt as string | undefined,
  };
}

// Parse ISO 8601 duration to seconds
export function parseDuration(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Fetch ALL channel videos by paginating through the uploads playlist
export async function fetchAllChannelVideos(
  channelId: string,
  onProgress?: (fetched: number, total: number) => void
): Promise<VideoData[]> {
  const uploadsPlaylistId = "UU" + channelId.slice(2);
  const allVideoIds: string[] = [];
  let nextPageToken: string | undefined;

  // Step 1: Paginate through playlist to collect all video IDs
  do {
    const url = `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch playlist");
    }

    if (!data.items?.length) break;

    const ids = data.items
      .map((item: Record<string, Record<string, string>>) => item.contentDetails?.videoId)
      .filter(Boolean);
    allVideoIds.push(...ids);

    nextPageToken = data.nextPageToken;

    if (onProgress) {
      onProgress(allVideoIds.length, data.pageInfo?.totalResults || allVideoIds.length);
    }
  } while (nextPageToken);

  if (!allVideoIds.length) return [];

  // Step 2: Fetch video details in batches of 50
  const allVideos: VideoData[] = [];

  for (let i = 0; i < allVideoIds.length; i += 50) {
    const batch = allVideoIds.slice(i, i + 50);
    const statsUrl = `${BASE}/videos?part=statistics,snippet,contentDetails&id=${batch.join(",")}&key=${API_KEY}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    if (statsData.error) {
      throw new Error(statsData.error.message || "Failed to fetch video details");
    }

    const videos = (statsData.items || []).map(
      (item: Record<string, unknown>): VideoData => {
        const snippet = item.snippet as Record<string, unknown>;
        const statistics = item.statistics as Record<string, string>;
        const contentDetails = item.contentDetails as Record<string, string>;
        const thumbnails = snippet.thumbnails as Record<string, { url: string }>;
        const durationSeconds = parseDuration(contentDetails?.duration || "");

        return {
          videoId: item.id as string,
          title: snippet.title as string,
          publishedAt: snippet.publishedAt as string,
          viewCount: parseInt(statistics.viewCount || "0", 10),
          likeCount: parseInt(statistics.likeCount || "0", 10),
          commentCount: parseInt(statistics.commentCount || "0", 10),
          thumbnail:
            thumbnails?.maxres?.url ||
            thumbnails?.high?.url ||
            thumbnails?.medium?.url ||
            "",
          duration: contentDetails?.duration,
          durationSeconds,
          isShort: durationSeconds > 0 && durationSeconds <= 60,
          tags: (snippet.tags as string[]) || undefined,
          description: ((snippet.description as string) || "").slice(0, 500),
        };
      }
    );
    allVideos.push(...videos);

    if (onProgress) {
      onProgress(allVideoIds.length, allVideoIds.length);
    }
  }

  // Sort by view count descending
  allVideos.sort((a, b) => b.viewCount - a.viewCount);

  return allVideos;
}
