import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import type { AdminFaqCategory } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { FaqQuestionForm } from '../faq-question-form';

export const metadata: Metadata = { title: 'Add FAQ question' };

export default async function NewFaqQuestionPage() {
  const { permissions } = await getAdminAccess('/admin/faq-questions');
  if (!permissions.has('faq_question_create')) {
    return <AccessDenied />;
  }
  const categories = await apiRequest<AdminFaqCategory[]>('/admin/faq-categories');
  return (
    <>
      <PageHeader
        title="Add FAQ question"
        back={{ href: '/admin/faq-questions', label: 'FAQ questions' }}
      />
      <FaqQuestionForm
        id={null}
        initialValues={{ question: '', answer: '' }}
        categories={categories.map((category) => ({
          value: category.id,
          label: category.name ?? `Category ${category.id}`,
        }))}
      />
    </>
  );
}
