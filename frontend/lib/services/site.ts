import { get } from '@/lib/services/http';

export type HomeContent = { hero_image_url: string | null };
export type WarrantyDocument = { id: number; title: string; file_url: string };

export async function getHomeContent(): Promise<HomeContent> {
  const response = await get<HomeContent>('/site/home/');
  return response.data;
}

export async function listWarrantyDocuments(): Promise<WarrantyDocument[]> {
  const response = await get<WarrantyDocument[]>('/site/warranties/');
  return response.data;
}
