import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PDF Export Utilities for AttendAI
 * Generates professional PDF reports for attendance data
 */

// Brand colors
const COLORS = {
  primary: [6, 182, 212],      // Cyan
  secondary: [139, 92, 246],   // Purple
  dark: [17, 24, 39],          // Gray-900
  light: [229, 231, 235],      // Gray-200
  success: [16, 185, 129],     // Green
  warning: [245, 158, 11],     // Amber
  danger: [239, 68, 68],       // Red
};

/**
 * Add header to PDF with logo and branding
 */
const addHeader = (doc, title) => {
  // Gradient-like header background
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AttendAI', 14, 20);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  doc.text('Smart Attendance System', 14, 28);
  
  // Report title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.light);
  doc.text(title, 196, 20, { align: 'right' });
  
  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 28, { align: 'right' });
  
  // Cyan accent line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);
};

/**
 * Add footer to PDF
 */
const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    '© AttendAI - Powered by AI',
    14,
    pageHeight - 10
  );
};

/**
 * Export Student Attendance Analytics to PDF
 * @param {Array} analytics - Array of subject analytics data
 * @param {Object} student - Student information
 */
export const exportStudentAttendancePDF = (analytics, student = {}) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Student Attendance Report');
  
  // Student info
  let yPos = 50;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 14, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  if (student.name) doc.text(`Name: ${student.name}`, 14, yPos);
  if (student.course) doc.text(`Course: ${student.course}`, 100, yPos);
  yPos += 6;
  if (student.email) doc.text(`Email: ${student.email}`, 14, yPos);
  if (student.semester) doc.text(`Semester: ${student.semester}`, 100, yPos);
  
  // Summary stats
  yPos += 15;
  const totalClasses = analytics.reduce((sum, s) => sum + s.total, 0);
  const totalPresent = analytics.reduce((sum, s) => sum + s.present + s.late, 0);
  const overallPercentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, yPos, 182, 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Summary', 20, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Classes: ${totalClasses}`, 20, yPos + 18);
  doc.text(`Present: ${totalPresent}`, 70, yPos + 18);
  
  // Overall percentage with color
  const percentColor = overallPercentage >= 75 ? COLORS.success : overallPercentage >= 50 ? COLORS.warning : COLORS.danger;
  doc.setTextColor(...percentColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Overall: ${overallPercentage}%`, 130, yPos + 18);
  
  // Subject-wise table
  yPos += 35;
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject-wise Attendance', 14, yPos);
  
  // Table data
  const tableData = analytics.map(item => [
    item.subject,
    item.total.toString(),
    item.present.toString(),
    item.late.toString(),
    item.absent.toString(),
    `${item.percentage}%`,
    item.status === 'eligible' ? '✓ Eligible' : '✗ Shortage'
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Subject', 'Total', 'Present', 'Late', 'Absent', 'Percentage', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.dark,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 45 },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const status = data.cell.raw;
        if (status.includes('Eligible')) {
          data.cell.styles.textColor = COLORS.success;
        } else {
          data.cell.styles.textColor = COLORS.danger;
        }
      }
    },
  });
  
  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  // Save
  const fileName = `AttendAI_Student_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

/**
 * Export Teacher's Student Attendance Data to PDF
 * @param {Array} students - Array of student attendance data
 * @param {Object} filters - Selected filters (subject, course, semester, month)
 */
export const exportTeacherAttendancePDF = (students, filters = {}) => {
  const doc = new jsPDF('landscape'); // Landscape for more columns
  
  addHeader(doc, 'Class Attendance Report');
  
  // Filter info
  let yPos = 50;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details', 14, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  
  const filterText = [];
  if (filters.subject) filterText.push(`Subject: ${filters.subject}`);
  if (filters.course) filterText.push(`Course: ${filters.course}`);
  if (filters.semester) filterText.push(`Semester: ${filters.semester}`);
  if (filters.month) filterText.push(`Period: ${filters.month}`);
  if (filters.isOverall) filterText.push('Period: Overall');
  
  doc.text(filterText.join('  |  ') || 'All Classes', 14, yPos);
  
  // Summary
  yPos += 15;
  const totalStudents = students.length;
  const avgPercentage = students.length > 0
    ? (students.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / students.length).toFixed(1)
    : 0;
  const studentsWithShortage = students.filter(s => s.status === 'shortage').length;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, yPos, 269, 20, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Total Students: ${totalStudents}`, 20, yPos + 12);
  doc.text(`Average Attendance: ${avgPercentage}%`, 100, yPos + 12);
  
  doc.setTextColor(...COLORS.danger);
  doc.text(`Students with Shortage: ${studentsWithShortage}`, 200, yPos + 12);
  
  // Table
  yPos += 30;
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Attendance Details', 14, yPos);
  
  const tableData = students.map((student, index) => [
    (index + 1).toString(),
    student.student?.name || 'N/A',
    student.student?.email || 'N/A',
    student.eligibleClasses?.toString() || student.totalClasses?.toString() || '0',
    student.presentCount?.toString() || '0',
    student.lateCount?.toString() || '0',
    `${student.percentage}%`,
    student.status === 'eligible' ? '✓ OK' : '✗ Low'
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['#', 'Student Name', 'Email', 'Classes', 'Present', 'Late', 'Percentage', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.dark,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 60 },
      6: { halign: 'center' },
      7: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.raw;
        if (status.includes('OK')) {
          data.cell.styles.textColor = COLORS.success;
        } else {
          data.cell.styles.textColor = COLORS.danger;
        }
      }
    },
  });
  
  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  // Save
  const fileName = `AttendAI_Class_Report_${filters.subject || 'All'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

/**
 * Export Class Attendance (single class) to PDF
 * @param {Array} records - Attendance records for a class
 * @param {Object} classInfo - Class information
 */
export const exportClassAttendancePDF = (records, classInfo = {}) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Class Attendance Sheet');
  
  // Class info
  let yPos = 50;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Information', 14, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  if (classInfo.subject) doc.text(`Subject: ${classInfo.subject}`, 14, yPos);
  if (classInfo.date) doc.text(`Date: ${classInfo.date}`, 100, yPos);
  yPos += 6;
  if (classInfo.course) doc.text(`Course: ${classInfo.course}`, 14, yPos);
  if (classInfo.time) doc.text(`Time: ${classInfo.time}`, 100, yPos);
  
  // Summary
  yPos += 15;
  const totalStudents = records.length;
  const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, yPos, 182, 20, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${totalStudents}`, 20, yPos + 12);
  doc.setTextColor(...COLORS.success);
  doc.text(`Present: ${presentCount}`, 70, yPos + 12);
  doc.setTextColor(...COLORS.danger);
  doc.text(`Absent: ${absentCount}`, 130, yPos + 12);
  
  // Table
  yPos += 30;
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Record', 14, yPos);
  
  const tableData = records.map((record, index) => [
    (index + 1).toString(),
    record.student?.name || 'N/A',
    record.student?.email || 'N/A',
    record.status?.toUpperCase() || 'ABSENT',
    record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '-'
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['#', 'Student Name', 'Email', 'Status', 'Marked At']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.dark,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw;
        if (status === 'PRESENT') {
          data.cell.styles.textColor = COLORS.success;
        } else if (status === 'LATE') {
          data.cell.styles.textColor = COLORS.warning;
        } else {
          data.cell.styles.textColor = COLORS.danger;
        }
      }
    },
  });
  
  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  // Save
  const fileName = `AttendAI_${classInfo.subject || 'Class'}_${classInfo.date || new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export default {
  exportStudentAttendancePDF,
  exportTeacherAttendancePDF,
  exportClassAttendancePDF,
};

