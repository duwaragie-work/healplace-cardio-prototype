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
            const originalFileName = file.originalname;
            const fileExtension = originalFileName.split('.').pop();
            const chunkCount = content.length;
            const fileSizeMB = file.size / (1024 * 1024);
            const activeStatus = true;
            const createdAt = new Date();
            const updatedAt = new Date();
            const sourceType = body.sourceType;
            
            return {
                message: 'Document uploaded and processed successfully',
                data: {
                    originalName: file.originalname,
                    content: content,
                    fileExtension: fileExtension,
                    chunkCount: chunkCount,
                    fileSizeMB: fileSizeMB,
                    activeStatus: activeStatus,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                    sourceType: sourceType
                }
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
