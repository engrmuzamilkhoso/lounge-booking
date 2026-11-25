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
import { type AuditActor, CurrentAuditActor } from '../../audit/audit-actor.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../../common/dto/id-list.dto.js';
import { type CardResponse, SaveCardDto } from './card.dto.js';
import { CardsService } from './cards.service.js';

@ApiTags('Admin: bank cards')
@ApiBearerAuth()
@Controller('admin/cards')
export class AdminCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @RequirePermissions('card_access')
  findAll(): Promise<CardResponse[]> {
    return this.cardsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('card_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CardResponse> {
    return this.cardsService.findOne(id);
  }

  @Post()
  @RequirePermissions('card_create')
  create(@Body() dto: SaveCardDto, @CurrentAuditActor() actor: AuditActor): Promise<CardResponse> {
    return this.cardsService.create(dto, actor);
  }

  @Patch(':id')
  @RequirePermissions('card_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveCardDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<CardResponse> {
    return this.cardsService.update(id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions('card_delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<void> {
    await this.cardsService.findOne(id);
    await this.cardsService.softDelete([id], actor);
  }

  @Delete()
  @RequirePermissions('card_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto, @CurrentAuditActor() actor: AuditActor): Promise<void> {
    return this.cardsService.softDelete(dto.ids, actor);
  }
}
