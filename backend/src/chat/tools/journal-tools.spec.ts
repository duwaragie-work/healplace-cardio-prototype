import { jest } from '@jest/globals'
import { getJournalToolDeclarations, executeJournalTool, normaliseTime } from './journal-tools.js'

describe('journal-tools', () => {
  describe('normaliseTime', () => {
    it('should return HH:mm for already valid 24h format', () => {
      expect(normaliseTime('08:30')).toBe('08:30')
      expect(normaliseTime('14:15')).toBe('14:15')
      expect(normaliseTime('23:59')).toBe('23:59')
    })

    it('should convert AM/PM with minutes', () => {
      expect(normaliseTime('1:00 PM')).toBe('13:00')
      expect(normaliseTime('8:30 am')).toBe('08:30')
      expect(normaliseTime('12:00 PM')).toBe('12:00')
      expect(normaliseTime('12:00 AM')).toBe('00:00')
    })

    it('should convert AM/PM without minutes', () => {
      expect(normaliseTime('2 PM')).toBe('14:00')
      expect(normaliseTime('8 am')).toBe('08:00')
    })

    it('should handle bare H:mm format', () => {
      expect(normaliseTime('9:30')).toBe('09:30')
    })

    it('should return undefined for invalid input', () => {
      expect(normaliseTime(undefined)).toBeUndefined()
      expect(normaliseTime('')).toBeUndefined()
      expect(normaliseTime('not a time')).toBeUndefined()
    })
  })

  describe('getJournalToolDeclarations', () => {
    it('should return 4 tool declarations', () => {
      const declarations = getJournalToolDeclarations()
      expect(declarations).toHaveLength(4)
      expect(declarations.map((d) => d.name)).toEqual([
        'submit_checkin',
        'get_recent_readings',
        'update_checkin',
        'delete_checkin',
      ])
    })

    it('should have required fields on submit_checkin', () => {
      const declarations = getJournalToolDeclarations()
      const submit = declarations.find((d) => d.name === 'submit_checkin')!
      expect(submit.parameters?.required).toContain('systolic_bp')
      expect(submit.parameters?.required).toContain('diastolic_bp')
      expect(submit.parameters?.required).toContain('medication_taken')
    })
  })

  describe('executeJournalTool', () => {
    const mockJournalService = {
      create: jest.fn<any>(),
      findAll: jest.fn<any>(),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should execute submit_checkin and return saved result', async () => {
      mockJournalService.create.mockResolvedValue({
        data: { id: '123', systolicBP: 120, diastolicBP: 80 },
      })

      const result = await executeJournalTool(
        'submit_checkin',
        { entry_date: '2026-04-06', systolic_bp: 120, diastolic_bp: 80, medication_taken: true },
        mockJournalService as any,
        'user-1',
      )

      const parsed = JSON.parse(result)
      expect(parsed.saved).toBe(true)
      expect(mockJournalService.create).toHaveBeenCalledWith('user-1', expect.objectContaining({
        systolicBP: 120,
        diastolicBP: 80,
      }))
    })

    it('should execute get_recent_readings', async () => {
      mockJournalService.findAll.mockResolvedValue({
        data: [{ id: '1', entryDate: '2026-04-05', systolicBP: 120, diastolicBP: 80 }],
      })

      const result = await executeJournalTool(
        'get_recent_readings',
        { days: 7 },
        mockJournalService as any,
        'user-1',
      )

      const parsed = JSON.parse(result)
      expect(parsed.count).toBe(1)
      expect(parsed.readings).toHaveLength(1)
    })

    it('should execute update_checkin', async () => {
      mockJournalService.update.mockResolvedValue({
        data: { id: '123', systolicBP: 125 },
      })

      const result = await executeJournalTool(
        'update_checkin',
        { entry_id: '123', systolic_bp: 125 },
        mockJournalService as any,
        'user-1',
      )

      const parsed = JSON.parse(result)
      expect(parsed.updated).toBe(true)
    })

    it('should execute delete_checkin', async () => {
      mockJournalService.delete.mockResolvedValue(undefined)

      const result = await executeJournalTool(
        'delete_checkin',
        { entry_id: '123' },
        mockJournalService as any,
        'user-1',
      )

      const parsed = JSON.parse(result)
      expect(parsed.deleted).toBe(true)
    })

    it('should return error for unknown tool', async () => {
      const result = await executeJournalTool(
        'unknown_tool',
        {},
        mockJournalService as any,
        'user-1',
      )

      const parsed = JSON.parse(result)
      expect(parsed.error).toBe('Unknown tool: unknown_tool')
    })
  })
})
