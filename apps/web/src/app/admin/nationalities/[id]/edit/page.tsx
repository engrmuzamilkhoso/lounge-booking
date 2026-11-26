import { NameLookupFormPage } from '@/components/admin/name-lookup/name-lookup-pages';
import { idParam } from '@/lib/admin/queries';

export const metadata = { title: 'Edit' };

export default async function Page({ params }: PageProps<'/admin/nationalities/[id]/edit'>) {
  const { id } = await params;
  return <NameLookupFormPage lookup="nationalities" id={idParam(id)} />;
}
