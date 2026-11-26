import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { PageHeader } from '@/components/admin/page-header';
import { getAdminAccess } from '@/lib/admin/access';
import { getRecordOrNotFound, idParam } from '@/lib/admin/queries';
import type { AdminFaqCategory, AdminFaqQuestion } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';
import { FaqQuestionForm } from '../../faq-question-form';

export const metadata: Metadata = { title: 'Edit FAQ question' };

export default async function EditFaqQuestionPage({
  params,
}: PageProps<'/admin/faq-questions/[id]/edit'>) {
  const { permissions } = await getAdminAccess('/admin/faq-questions');
  if (!permissions.has('faq_question_edit')) {
    return <AccessDenied />;
  }
  const { id } = await params;
  const [question, categories] = await Promise.all([
    getRecordOrNotFound<AdminFaqQuestion>(`/admin/faq-questions/${idParam(id)}`),
    apiRequest<AdminFaqCategory[]>('/admin/faq-categories'),
  ]);
  return (
    <>
      <PageHeader
        title="Edit FAQ question"
        back={{ href: '/admin/faq-questions', label: 'FAQ questions' }}
      />
      <FaqQuestionForm
        id={question.id}
        initialValues={{
          categoryId: question.category?.id,
          question: question.question ?? '',
          answer: question.answer ?? '',
        }}
        categories={categories.map((category) => ({
          value: category.id,
          label: category.name ?? `Category ${category.id}`,
        }))}
      />
    </>
  );
}
