import { NameLookupListPage } from '@/components/admin/name-lookup/name-lookup-pages';
import { nameLookups } from '@/lib/admin/name-lookups';

export const metadata = { title: nameLookups.sourceRequests.title };

export default async function Page({ searchParams }: PageProps<'/admin/source-requests'>) {
  return <NameLookupListPage lookup="sourceRequests" searchParams={await searchParams} />;
}
