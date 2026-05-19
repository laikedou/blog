import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassroomDto {
  @ApiProperty({ description: 'Classroom name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Visualization ID to share' })
  @IsInt()
  visualizationId: number;
}

export class JoinClassroomDto {
  @ApiProperty({ description: '6-character join code' })
  @IsString()
  joinCode: string;
}
