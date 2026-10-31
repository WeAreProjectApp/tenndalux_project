import { get } from '@/lib/services/http';
import { mediaUrl } from '@/lib/services/content';
import details from '@/lib/data/productDetails.json';

export type Product = {
  key: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
};

type ProductDetails = {
  tagline: string;
  idealPara: string[];
  beneficios: string[];
  especificaciones: string[];
  opciones: string[];
  featured: boolean;
};

export type ProductCard = ProductDetails & {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  image: string;
};

export async function listProducts(): Promise<Product[]> {
  const response = await get<Product[]>('/products/');
  return response.data;
}

export function toProductCard(product: Product): ProductCard {
  return {
    ...(details as Record<string, ProductDetails>)[product.key],
    id: product.key,
    name: product.name,
    category: product.category,
    shortDescription: product.description,
    image: productImageUrl(product.image_url),
  };
}

export function productImageUrl(path: string): string {
  // Original photographs ship with Next; uploaded replacements live on Django.
  return path.startsWith('/products/') ? path : mediaUrl(path);
}
