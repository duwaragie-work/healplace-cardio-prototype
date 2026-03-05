import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidationOptions,
} from 'class-validator'

// ─── Custom validator: date must not be in the future ─────────────────────────

function IsDateNotInFuture(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isDateNotInFuture',
      target: (object as { constructor: new (...args: unknown[]) => unknown })
        .constructor,
      propertyName,
      options: {
        message: `${propertyName} must not be a future date`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false
          const d = new Date(value)
          if (isNaN(d.getTime())) return false

          // Compare date-only (ignore time) in UTC
          const today = new Date()
          today.setHours(23, 59, 59, 999)
          return d <= today
        },
      },
    })
  }
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export class CreateJournalEntryDto {
  /**
   * Date of the journal entry in YYYY-MM-DD format.
   * Must not be a future date.
   * Each user can only have one entry per date.
   */
  @IsNotEmpty({ message: 'entryDate is required' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'entryDate must be in YYYY-MM-DD format',
  })
  @IsDateNotInFuture()
  entryDate!: string

  /**
   * Total hours of sleep (0–24). Decimals allowed (e.g. 7.5).
   * Maps to Decimal(4,2) in the database.
   */
  @IsNotEmpty({ message: 'sleepHours is required' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'sleepHours must be a number with at most 2 decimal places' },
  )
  @Min(0, { message: 'sleepHours must be at least 0' })
  @Max(24, { message: 'sleepHours must be at most 24' })
  sleepHours!: number

  /**
   * Subjective sleep quality rating on a 1–10 scale.
   */
  @IsNotEmpty({ message: 'sleepQuality is required' })
  @IsInt({ message: 'sleepQuality must be an integer' })
  @Min(1, { message: 'sleepQuality must be at least 1' })
  @Max(10, { message: 'sleepQuality must be at most 10' })
  sleepQuality!: number

  /**
   * Number of times the user woke up during the night.
   */
  @IsNotEmpty({ message: 'awakenings is required' })
  @IsInt({ message: 'awakenings must be an integer' })
  @Min(0, { message: 'awakenings must be at least 0' })
  awakenings!: number

  /**
   * Optional free-text notes about the day/sleep.
   * Maximum 2000 characters.
   */
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  @MaxLength(2000, { message: 'notes must be at most 2000 characters' })
  notes?: string
}
