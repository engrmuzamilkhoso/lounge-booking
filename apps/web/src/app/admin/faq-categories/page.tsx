import { NameLookupListPage } from '@/components/admin/name-lookup/name-lookup-pages';
import { nameLookups } from '@/lib/admin/name-lookups';

export const metadata = { title: nameLookups.faqCategories.title };

export default async function Page({ searchParams }: PageProps<'/admin/faq-categories'>) {
  return <NameLookupListPage lookup="faqCategories" searchParams={await searchParams} />;
}
