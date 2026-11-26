import { NameLookupListPage } from '@/components/admin/name-lookup/name-lookup-pages';
import { nameLookups } from '@/lib/admin/name-lookups';

export const metadata = { title: nameLookups.statuses.title };

export default async function Page({ searchParams }: PageProps<'/admin/statuses'>) {
  return <NameLookupListPage lookup="statuses" searchParams={await searchParams} />;
}
