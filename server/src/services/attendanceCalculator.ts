export type ApprovedLeavePolicy =
  | 'EXCLUDE_FROM_TOTAL' // Recommended: Total effective days = Total days - Approved Leave days
  | 'COUNT_AS_PRESENT'    // Count approved leave days as present (1.0)
  | 'EXCUSED_ABSENT';     // Count approved leave days as 0.0 towards attendance

export interface IAttendanceRecordSummary {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'APPROVED_LEAVE';
  date?: string;
  session?: string;
}

export interface IAttendanceCalculationResult {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  effectivePresentDays: number;
  effectiveTotalDays: number;
  percentage: number;
  policyUsed: ApprovedLeavePolicy;
}

export class AttendanceCalculatorService {
  /**
   * Calculates standardized attendance statistics across all platform modules.
   *
   * @param records List of attendance records containing status
   * @param policy Leave policy: 'EXCLUDE_FROM_TOTAL' (default), 'COUNT_AS_PRESENT', or 'EXCUSED_ABSENT'
   */
  public static calculate(
    records: Array<{ status: string }>,
    policy: ApprovedLeavePolicy = 'EXCLUDE_FROM_TOTAL'
  ): IAttendanceCalculationResult {
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let leaveDays = 0;

    for (const r of records) {
      switch (r.status) {
        case 'PRESENT':
          presentDays++;
          break;
        case 'ABSENT':
          absentDays++;
          break;
        case 'LATE':
          lateDays++;
          break;
        case 'HALF_DAY':
          halfDays++;
          break;
        case 'APPROVED_LEAVE':
          leaveDays++;
          break;
        default:
          // Unrecognized status treated as absent
          absentDays++;
          break;
      }
    }

    const totalDays = records.length;

    let effectivePresentDays = 0;
    let effectiveTotalDays = totalDays;

    switch (policy) {
      case 'EXCLUDE_FROM_TOTAL':
        // Total working days denominator excludes approved leaves
        effectivePresentDays = presentDays + lateDays + halfDays * 0.5;
        effectiveTotalDays = Math.max(0, totalDays - leaveDays);
        break;

      case 'COUNT_AS_PRESENT':
        // Approved leave counted as present days
        effectivePresentDays = presentDays + lateDays + halfDays * 0.5 + leaveDays;
        effectiveTotalDays = totalDays;
        break;

      case 'EXCUSED_ABSENT':
        // Approved leave counted in total days but not in present days
        effectivePresentDays = presentDays + lateDays + halfDays * 0.5;
        effectiveTotalDays = totalDays;
        break;
    }

    let percentage = 0;
    if (effectiveTotalDays > 0) {
      percentage = Math.round((effectivePresentDays / effectiveTotalDays) * 100 * 10) / 10;
      percentage = Math.min(100, Math.max(0, percentage)); // Clamp between 0 and 100
    } else if (totalDays > 0 && leaveDays === totalDays && policy === 'EXCLUDE_FROM_TOTAL') {
      // 100% of days were approved leave -> 100% attendance standing
      percentage = 100;
    }

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      leaveDays,
      effectivePresentDays: Math.round(effectivePresentDays * 10) / 10,
      effectiveTotalDays,
      percentage,
      policyUsed: policy,
    };
  }

  /**
   * Helper to aggregate classroom or platform metrics from grouped attendance counts
   */
  public static calculateFromCounts(
    counts: {
      present: number;
      absent: number;
      late: number;
      halfDay: number;
      approvedLeave: number;
    },
    policy: ApprovedLeavePolicy = 'EXCLUDE_FROM_TOTAL'
  ): {
    totalRecorded: number;
    effectivePresent: number;
    effectiveTotal: number;
    percentage: number;
  } {
    const totalRecorded =
      counts.present + counts.absent + counts.late + counts.halfDay + counts.approvedLeave;

    let effectivePresent = 0;
    let effectiveTotal = totalRecorded;

    switch (policy) {
      case 'EXCLUDE_FROM_TOTAL':
        effectivePresent = counts.present + counts.late + counts.halfDay * 0.5;
        effectiveTotal = Math.max(0, totalRecorded - counts.approvedLeave);
        break;
      case 'COUNT_AS_PRESENT':
        effectivePresent = counts.present + counts.late + counts.halfDay * 0.5 + counts.approvedLeave;
        effectiveTotal = totalRecorded;
        break;
      case 'EXCUSED_ABSENT':
        effectivePresent = counts.present + counts.late + counts.halfDay * 0.5;
        effectiveTotal = totalRecorded;
        break;
    }

    let percentage = 0;
    if (effectiveTotal > 0) {
      percentage = Math.round((effectivePresent / effectiveTotal) * 100 * 10) / 10;
      percentage = Math.min(100, Math.max(0, percentage));
    } else if (totalRecorded > 0 && counts.approvedLeave === totalRecorded) {
      percentage = 100;
    }

    return {
      totalRecorded,
      effectivePresent: Math.round(effectivePresent * 10) / 10,
      effectiveTotal,
      percentage,
    };
  }
}

