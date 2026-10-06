import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WarrantyDocuments from '@/components/legal/WarrantyDocuments';
import messages from '@/messages/es.json';

export const metadata: Metadata = {
  title: messages.warranties.pageTitle,
  description: messages.warranties.pageDescription,
};

export default function WarrantiesPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <WarrantyDocuments />
      <Footer />
    </main>
  );
}
