import { Alert } from '@/components/ui/alert';

const messages: Record<string, string> = {
  created: 'Saved. The new record has been created.',
  updated: 'Saved. Your changes have been stored.',
  deleted: 'Deleted.',
  approved: 'Membership approved.',
};

/** Confirmation after a save or delete, passed as `?notice=created` by the redirect. */
export function Notice({ notice }: { notice: string | string[] | undefined }) {
  if (typeof notice !== 'string') {
    return null;
  }
  const message = messages[notice];
  if (message === undefined) {
    return null;
  }
  return (
    <Alert tone="success" className="mb-4">
      {message}
    </Alert>
  );
}
