import PDFDocument from 'pdfkit';

export interface IStudentReportCardData {
  schoolName: string;
  affiliation: string;
  address: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber?: string;
  academicYear: string;
  examName: string;
  subjects: {
    subjectName: string;
    subjectCode: string;
    maxMarks: number;
    passingMarks: number;
    marksObtained: number;
    isAbsent: boolean;
    grade: string;
  }[];
  totalMaxMarks: number;
  totalMarksObtained: number;
  percentage: number;
  overallGrade: string;
  resultStatus: 'PASS' | 'FAIL';
  attendanceSummary: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  teacherRemarks?: string;
  generatedDate: string;
}

export interface IMonthlyAttendanceReportData {
  schoolName: string;
  className: string;
  sectionName: string;
  monthYear: string;
  totalWorkingDays: number;
  students: {
    rollNumber?: string;
    admissionNumber: string;
    studentName: string;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    leaveDays: number;
    attendancePercentage: number;
  }[];
  generatedDate: string;
}

export class PdfService {
  /**
   * Generates a Student Examination Report Card PDF
   */
  public generateReportCard(data: IStudentReportCardData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Outer border
        doc
          .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
          .lineWidth(1.5)
          .strokeColor('#0f172a')
          .stroke();

        doc
          .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
          .lineWidth(0.5)
          .strokeColor('#94a3b8')
          .stroke();

        // School Header
        doc.moveDown(0.5);
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(data.schoolName.toUpperCase(), { align: 'center' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Affiliated to ${data.affiliation} | ${data.address}`, { align: 'center' });

        doc.moveDown(0.3);
        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#059669')
          .text(`PROGRESS REPORT CARD - ${data.academicYear}`, { align: 'center' });

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#1e293b')
          .text(data.examName, { align: 'center' });

        doc.moveDown(0.8);

        // Divider
        doc
          .moveTo(40, doc.y)
          .lineTo(doc.page.width - 40, doc.y)
          .strokeColor('#cbd5e1')
          .lineWidth(1)
          .stroke();

        doc.moveDown(0.8);

        // Student Info Grid
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155');

        doc.text(`Student Name: `, 45, startY);
        doc.font('Helvetica').text(data.studentName, 130, startY);

        doc.font('Helvetica-Bold').text(`Admission No: `, 340, startY);
        doc.font('Helvetica').text(data.admissionNumber, 430, startY);

        doc.font('Helvetica-Bold').text(`Class & Section: `, 45, startY + 18);
        doc.font('Helvetica').text(`${data.className} - ${data.sectionName}`, 130, startY + 18);

        doc.font('Helvetica-Bold').text(`Roll No: `, 340, startY + 18);
        doc.font('Helvetica').text(data.rollNumber || 'N/A', 430, startY + 18);

        doc.font('Helvetica-Bold').text(`Attendance: `, 45, startY + 36);
        doc
          .font('Helvetica')
          .text(
            `${data.attendanceSummary.presentDays}/${data.attendanceSummary.totalDays} Days (${data.attendanceSummary.percentage}%)`,
            130,
            startY + 36
          );

        doc.font('Helvetica-Bold').text(`Result Status: `, 340, startY + 36);
        doc
          .font('Helvetica-Bold')
          .fillColor(data.resultStatus === 'PASS' ? '#059669' : '#dc2626')
          .text(data.resultStatus, 430, startY + 36);

        doc.moveDown(3);

        // Marks Table Header
        const tableTop = doc.y + 10;
        doc.rect(40, tableTop, doc.page.width - 80, 24).fillColor('#f1f5f9').fill();

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
        doc.text('Subject', 50, tableTop + 7);
        doc.text('Code', 220, tableTop + 7);
        doc.text('Max Marks', 290, tableTop + 7);
        doc.text('Passing', 370, tableTop + 7);
        doc.text('Marks Obtained', 430, tableTop + 7);
        doc.text('Grade', 520, tableTop + 7);

        let currentY = tableTop + 24;

        // Table Rows
        data.subjects.forEach((subj, idx) => {
          if (idx % 2 === 1) {
            doc.rect(40, currentY, doc.page.width - 80, 20).fillColor('#f8fafc').fill();
          }

          doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
          doc.text(subj.subjectName, 50, currentY + 5);
          doc.text(subj.subjectCode, 220, currentY + 5);
          doc.text(String(subj.maxMarks), 305, currentY + 5);
          doc.text(String(subj.passingMarks), 385, currentY + 5);
          
          if (subj.isAbsent) {
            doc.font('Helvetica-Bold').fillColor('#dc2626').text('AB (Absent)', 445, currentY + 5);
          } else {
            doc.text(String(subj.marksObtained), 455, currentY + 5);
          }

          doc.font('Helvetica-Bold').fillColor('#0f172a').text(subj.grade, 525, currentY + 5);

          currentY += 20;
        });

        // Summary Line
        doc
          .rect(40, currentY, doc.page.width - 80, 24)
          .fillColor('#e2e8f0')
          .fill();

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
        doc.text('Grand Total & Percentage', 50, currentY + 7);
        doc.text(`${data.totalMarksObtained} / ${data.totalMaxMarks}`, 430, currentY + 7);
        doc.text(`${data.percentage}% (${data.overallGrade})`, 515, currentY + 7);

        currentY += 35;

        // Teacher Remarks
        if (data.teacherRemarks) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('Teacher Remarks: ', 45, currentY);
          doc.font('Helvetica-Oblique').fillColor('#475569').text(data.teacherRemarks, 145, currentY);
          currentY += 25;
        }

        // Signatures
        const signY = doc.page.height - 90;
        doc.fontSize(9).font('Helvetica').fillColor('#64748b');

        doc.text('_______________________', 50, signY);
        doc.text('Class Teacher', 70, signY + 15);

        doc.text('_______________________', 240, signY);
        doc.text('Parent Signature', 260, signY + 15);

        doc.text('_______________________', 430, signY);
        doc.text('Principal / Headmaster', 435, signY + 15);

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text(
            `Generated on ${data.generatedDate} | 6th Civilians Corporation School Operations Platform`,
            40,
            doc.page.height - 35,
            { align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates Class Monthly Attendance Summary Report PDF
   */
  public generateMonthlyAttendanceReport(data: IMonthlyAttendanceReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(data.schoolName.toUpperCase(), { align: 'center' });

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#059669')
          .text(`MONTHLY ATTENDANCE REGISTER - ${data.monthYear.toUpperCase()}`, { align: 'center' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Class: ${data.className} - Section: ${data.sectionName} | Total Working Days: ${data.totalWorkingDays}`, {
            align: 'center',
          });

        doc.moveDown(1);

        // Table Header
        const tableTop = doc.y;
        doc.rect(40, tableTop, doc.page.width - 80, 22).fillColor('#1e293b').fill();

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('Roll', 45, tableTop + 6);
        doc.text('Adm No', 75, tableTop + 6);
        doc.text('Student Name', 140, tableTop + 6);
        doc.text('Present', 320, tableTop + 6);
        doc.text('Absent', 375, tableTop + 6);
        doc.text('Late', 425, tableTop + 6);
        doc.text('Leave', 465, tableTop + 6);
        doc.text('Attendance %', 505, tableTop + 6);

        let currentY = tableTop + 22;

        data.students.forEach((s, idx) => {
          if (idx % 2 === 1) {
            doc.rect(40, currentY, doc.page.width - 80, 18).fillColor('#f8fafc').fill();
          }

          doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b');
          doc.text(s.rollNumber || '-', 45, currentY + 4);
          doc.text(s.admissionNumber, 75, currentY + 4);
          doc.text(s.studentName, 140, currentY + 4);
          doc.text(String(s.presentDays), 330, currentY + 4);
          doc.text(String(s.absentDays), 385, currentY + 4);
          doc.text(String(s.lateDays), 430, currentY + 4);
          doc.text(String(s.leaveDays), 475, currentY + 4);

          // Color code percentage
          const pctColor = s.attendancePercentage >= 75 ? '#059669' : '#dc2626';
          doc.font('Helvetica-Bold').fillColor(pctColor).text(`${s.attendancePercentage}%`, 515, currentY + 4);

          currentY += 18;

          // Check if near page bottom
          if (currentY > doc.page.height - 60) {
            doc.addPage();
            currentY = 40;
          }
        });

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text(
            `Generated on ${data.generatedDate} | 6th Civilians Corporation School Operations Platform`,
            40,
            doc.page.height - 30,
            { align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const pdfService = new PdfService();

