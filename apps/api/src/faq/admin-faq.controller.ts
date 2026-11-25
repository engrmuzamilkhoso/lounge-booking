import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../common/dto/id-list.dto.js';
import {
  type FaqCategoryResponse,
  type FaqQuestionResponse,
  SaveFaqCategoryDto,
  SaveFaqQuestionDto,
} from './faq.dto.js';
import { FaqService } from './faq.service.js';

@ApiTags('Admin: FAQ')
@ApiBearerAuth()
@Controller('admin')
export class AdminFaqController {
  constructor(private readonly faqService: FaqService) {}

  // ────────────────────────────── Categories ──────────────────────────────

  @Get('faq-categories')
  @RequirePermissions('faq_category_access')
  findAllCategories(): Promise<FaqCategoryResponse[]> {
    return this.faqService.findAllCategories();
  }

  @Get('faq-categories/:id')
  @RequirePermissions('faq_category_show')
  findCategory(@Param('id', ParseIntPipe) id: number): Promise<FaqCategoryResponse> {
    return this.faqService.findCategory(id);
  }

  @Post('faq-categories')
  @RequirePermissions('faq_category_create')
  createCategory(@Body() dto: SaveFaqCategoryDto): Promise<FaqCategoryResponse> {
    return this.faqService.createCategory(dto);
  }

  @Patch('faq-categories/:id')
  @RequirePermissions('faq_category_edit')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveFaqCategoryDto,
  ): Promise<FaqCategoryResponse> {
    return this.faqService.updateCategory(id, dto);
  }

  @Delete('faq-categories/:id')
  @RequirePermissions('faq_category_delete')
  @HttpCode(HttpStatus.OK)
  async removeCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.faqService.findCategory(id);
    await this.faqService.softDeleteCategories([id]);
  }

  @Delete('faq-categories')
  @RequirePermissions('faq_category_delete')
  @HttpCode(HttpStatus.OK)
  removeCategories(@Body() dto: IdListDto): Promise<void> {
    return this.faqService.softDeleteCategories(dto.ids);
  }

  // ─────────────────────────────── Questions ──────────────────────────────

  @Get('faq-questions')
  @RequirePermissions('faq_question_access')
  findAllQuestions(): Promise<FaqQuestionResponse[]> {
    return this.faqService.findAllQuestions();
  }

  @Get('faq-questions/:id')
  @RequirePermissions('faq_question_show')
  findQuestion(@Param('id', ParseIntPipe) id: number): Promise<FaqQuestionResponse> {
    return this.faqService.findQuestion(id);
  }

  @Post('faq-questions')
  @RequirePermissions('faq_question_create')
  createQuestion(@Body() dto: SaveFaqQuestionDto): Promise<FaqQuestionResponse> {
    return this.faqService.createQuestion(dto);
  }

  @Patch('faq-questions/:id')
  @RequirePermissions('faq_question_edit')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveFaqQuestionDto,
  ): Promise<FaqQuestionResponse> {
    return this.faqService.updateQuestion(id, dto);
  }

  @Delete('faq-questions/:id')
  @RequirePermissions('faq_question_delete')
  @HttpCode(HttpStatus.OK)
  async removeQuestion(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.faqService.findQuestion(id);
    await this.faqService.softDeleteQuestions([id]);
  }

  @Delete('faq-questions')
  @RequirePermissions('faq_question_delete')
  @HttpCode(HttpStatus.OK)
  removeQuestions(@Body() dto: IdListDto): Promise<void> {
    return this.faqService.softDeleteQuestions(dto.ids);
  }
}
