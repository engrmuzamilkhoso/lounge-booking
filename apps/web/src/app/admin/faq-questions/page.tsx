import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { AccessDenied } from '@/components/admin/access-denied';
import { DataTable } from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Notice } from '@/components/admin/notice';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { getAdminAccess, resourcePermissions } from '@/lib/admin/access';
import { matchesSearch, searchParam } from '@/lib/admin/queries';
import type { AdminFaqQuestion } from '@/lib/admin/types';
import { apiRequest } from '@/lib/api/server-api';

export const metadata: Metadata = { title: 'FAQ questions' };

export default async function AdminFaqQuestionsPage({
  searchParams,
}: PageProps<'/admin/faq-questions'>) {
  const { permissions } = await getAdminAccess('/admin/faq-questions');
  const can = resourcePermissions(permissions, 'faq_question');
  if (!can.canList) {
    return <AccessDenied />;
  }
  const params = await searchParams;
  const search = searchParam(params.search);
  const questions = await apiRequest<AdminFaqQuestion[]>('/admin/faq-questions');
  const rows = questions.filter((question) =>
    matchesSearch(search, question.question, question.answer, question.category?.name ?? null),
  );

  return (
    <>
      <PageHeader
        title="FAQ questions"
        description="Questions and answers on the website's FAQ page."
        actions={
          can.canCreate ? (
            <ButtonLink
              href="/admin/faq-questions/new"
              icon={<Plus aria-hidden className="size-4" />}
            >
              Add question
            </ButtonLink>
          ) : undefined
        }
      />
      <Notice notice={params.notice} />
      <FilterBar search={search} searchPlaceholder="Search questions and answers" />
      <DataTable
        rows={rows}
        rowKey={(question) => question.id}
        emptyMessage={search === undefined ? 'No questions yet.' : 'No matches for your search.'}
        columns={[
          {
            header: 'Question',
            cell: (question) => (
              <span>
                <span className="font-medium">{question.question}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-stone-500">
                  {question.answer}
                </span>
              </span>
            ),
          },
          {
            header: 'Category',
            className: 'hidden md:table-cell whitespace-nowrap',
            cell: (question) => question.category?.name ?? '—',
          },
          {
            header: 'Actions',
            className: 'w-32 text-right',
            cell: (question) => (
              <RowActions
                resource="faqQuestions"
                id={question.id}
                label="question"
                editHref={can.canEdit ? `/admin/faq-questions/${question.id}/edit` : undefined}
                canDelete={can.canDelete}
              />
            ),
          },
        ]}
      />
    </>
  );
}
