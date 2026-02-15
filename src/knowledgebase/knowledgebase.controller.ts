import { Controller, Get, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgebaseService } from './knowledgebase.service';

@Controller('v2/knowledgebase')
export class KnowledgebaseController {
    constructor(private readonly knowledgebaseService: KnowledgebaseService) {}

    @Get()
    getAllKnowledgebase() {
        return {
            message: 'Knowledgebase router is healthy',
            data: []
        };
    }

    @Post('document/upload')
    @UseInterceptors(FileInterceptor('document'))
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        try {
            const content = await this.knowledgebaseService.processDocument(file.buffer, file.originalname);
            
            const savedDocument = await this.knowledgebaseService.saveDocument(file, content, {
                originalName: file.originalname,
                fileExtension: file.originalname.split('.').pop(),
                fileSize: file.size,
                sourceType: body.sourceType,
                sourceResourceLink: body.sourceResourceLink,
            });
            
            return {
                message: 'Document uploaded and processed successfully',
                data: savedDocument
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
