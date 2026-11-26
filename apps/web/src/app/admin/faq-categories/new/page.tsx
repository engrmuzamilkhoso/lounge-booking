import { NameLookupFormPage } from '@/components/admin/name-lookup/name-lookup-pages';

export const metadata = { title: 'Add' };

export default function Page() {
  return <NameLookupFormPage lookup="faqCategories" id={null} />;
}
