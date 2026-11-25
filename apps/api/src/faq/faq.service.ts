import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import { recordNotFound } from '../common/http/not-found.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  FaqCategoryResponse,
  FaqQuestionResponse,
  SaveFaqCategoryDto,
  SaveFaqQuestionDto,
} from './faq.dto.js';

const categorySelect = { id: true, category: true } as const;

const questionSelect = {
  id: true,
  question: true,
  answer: true,
  category: { select: categorySelect },
} satisfies Prisma.FaqQuestionSelect;

type QuestionRecord = Prisma.FaqQuestionGetPayload<{ select: typeof questionSelect }>;

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────── Questions ──────────────────────────────

  async findAllQuestions(): Promise<FaqQuestionResponse[]> {
    const questions = await this.prisma.faqQuestion.findMany({
      where: { deletedAt: null },
      select: questionSelect,
      orderBy: { id: 'asc' },
    });
    return questions.map(toQuestionResponse);
  }

  async findQuestion(id: number): Promise<FaqQuestionResponse> {
    const question = await this.prisma.faqQuestion.findFirst({
      where: { id, deletedAt: null },
      select: questionSelect,
    });
    if (question === null) {
      throw recordNotFound();
    }
    return toQuestionResponse(question);
  }

  async createQuestion(dto: SaveFaqQuestionDto): Promise<FaqQuestionResponse> {
    await this.assertCategoryExists(dto.categoryId);
    const question = await this.prisma.faqQuestion.create({
      data: { categoryId: dto.categoryId, question: dto.question, answer: dto.answer },
      select: questionSelect,
    });
    return toQuestionResponse(question);
  }

  async updateQuestion(id: number, dto: SaveFaqQuestionDto): Promise<FaqQuestionResponse> {
    await this.findQuestion(id);
    await this.assertCategoryExists(dto.categoryId);
    const question = await this.prisma.faqQuestion.update({
      where: { id },
      data: { categoryId: dto.categoryId, question: dto.question, answer: dto.answer },
      select: questionSelect,
    });
    return toQuestionResponse(question);
  }

  async softDeleteQuestions(ids: number[]): Promise<void> {
    await this.prisma.faqQuestion.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  // ────────────────────────────── Categories ──────────────────────────────

  async findAllCategories(): Promise<FaqCategoryResponse[]> {
    const categories = await this.prisma.faqCategory.findMany({
      where: { deletedAt: null },
      select: categorySelect,
      orderBy: { id: 'asc' },
    });
    return categories.map(toCategoryResponse);
  }

  async findCategory(id: number): Promise<FaqCategoryResponse> {
    const category = await this.prisma.faqCategory.findFirst({
      where: { id, deletedAt: null },
      select: categorySelect,
    });
    if (category === null) {
      throw recordNotFound();
    }
    return toCategoryResponse(category);
  }

  async createCategory(dto: SaveFaqCategoryDto): Promise<FaqCategoryResponse> {
    const category = await this.prisma.faqCategory.create({
      data: { category: dto.name },
      select: categorySelect,
    });
    return toCategoryResponse(category);
  }

  async updateCategory(id: number, dto: SaveFaqCategoryDto): Promise<FaqCategoryResponse> {
    await this.findCategory(id);
    const category = await this.prisma.faqCategory.update({
      where: { id },
      data: { category: dto.name },
      select: categorySelect,
    });
    return toCategoryResponse(category);
  }

  async softDeleteCategories(ids: number[]): Promise<void> {
    await this.prisma.faqCategory.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  private async assertCategoryExists(categoryId: number): Promise<void> {
    const category = await this.prisma.faqCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });
    if (category === null) {
      throw new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
        categoryId: ['The selected FAQ category does not exist'],
      });
    }
  }
}

function toCategoryResponse(category: {
  id: number;
  category: string | null;
}): FaqCategoryResponse {
  return { id: category.id, name: category.category };
}

function toQuestionResponse(question: QuestionRecord): FaqQuestionResponse {
  return {
    id: question.id,
    question: question.question,
    answer: question.answer,
    category: question.category === null ? null : toCategoryResponse(question.category),
  };
}
