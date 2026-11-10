import { AttendanceCalculatorService } from '../services/attendanceCalculator';

describe('Unified Attendance Calculation Policy', () => {
  it('calculates 100% attendance when all records are PRESENT', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
    ];
    const res = AttendanceCalculatorService.calculate(records);
    expect(res.totalDays).toBe(5);
    expect(res.presentDays).toBe(5);
    expect(res.absentDays).toBe(0);
    expect(res.percentage).toBe(100);
  });

  it('correctly weighs LATE arrivals as 1.0 towards attendance while keeping count', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'LATE' },
      { status: 'PRESENT' },
      { status: 'LATE' },
    ];
    const res = AttendanceCalculatorService.calculate(records);
    expect(res.presentDays).toBe(2);
    expect(res.lateDays).toBe(2);
    expect(res.effectivePresentDays).toBe(4);
    expect(res.percentage).toBe(100);
  });

  it('correctly weighs HALF_DAY as 0.5 towards attendance', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'HALF_DAY' },
      { status: 'HALF_DAY' },
      { status: 'ABSENT' },
    ];
    const res = AttendanceCalculatorService.calculate(records);
    expect(res.totalDays).toBe(4);
    expect(res.effectivePresentDays).toBe(2); // 1 + 0.5 + 0.5
    expect(res.percentage).toBe(50);
  });

  it('default policy EXCLUDE_FROM_TOTAL excludes APPROVED_LEAVE from the denominator', () => {
    // 5 total recorded days: 3 present, 1 absent, 1 approved leave
    // Effective total days = 5 - 1 = 4 days
    // Effective present = 3 days
    // Expected percentage = (3 / 4) * 100 = 75% (instead of 60% if penalized)
    const records = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ABSENT' },
      { status: 'APPROVED_LEAVE' },
    ];
    const res = AttendanceCalculatorService.calculate(records, 'EXCLUDE_FROM_TOTAL');
    expect(res.totalDays).toBe(5);
    expect(res.effectiveTotalDays).toBe(4);
    expect(res.leaveDays).toBe(1);
    expect(res.percentage).toBe(75);
  });

  it('supports policy COUNT_AS_PRESENT treating approved leave as present', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'APPROVED_LEAVE' },
    ];
    const res = AttendanceCalculatorService.calculate(records, 'COUNT_AS_PRESENT');
    expect(res.percentage).toBe(100);
  });

  it('supports policy EXCUSED_ABSENT counting approved leave in total days but not in present', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'APPROVED_LEAVE' },
    ];
    const res = AttendanceCalculatorService.calculate(records, 'EXCUSED_ABSENT');
    expect(res.percentage).toBe(50);
  });

  it('handles edge case: 0 records safely without dividing by zero', () => {
    const res = AttendanceCalculatorService.calculate([]);
    expect(res.totalDays).toBe(0);
    expect(res.percentage).toBe(0);
  });

  it('handles edge case: 100% of days are approved leave', () => {
    const records = [
      { status: 'APPROVED_LEAVE' },
      { status: 'APPROVED_LEAVE' },
    ];
    const res = AttendanceCalculatorService.calculate(records, 'EXCLUDE_FROM_TOTAL');
    expect(res.percentage).toBe(100);
  });
});

