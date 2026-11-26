import { NameLookupListPage } from '@/components/admin/name-lookup/name-lookup-pages';
import { nameLookups } from '@/lib/admin/name-lookups';

export const metadata = { title: nameLookups.nationalities.title };

export default async function Page({ searchParams }: PageProps<'/admin/nationalities'>) {
  return <NameLookupListPage lookup="nationalities" searchParams={await searchParams} />;
}
