import { redirect } from 'next/navigation';

/** Old address of the scan page; scanning now lives in the admin panel. */
export default function OldCheckInPage() {
  redirect('/admin/check-in');
}
