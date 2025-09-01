const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateUserReport(users, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `user-report-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '..', 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add logo and header
      addReportHeader(doc, 'USER MANAGEMENT REPORT');
      
      // Add filter information
      addFilterSection(doc, filters);
      
      // Summary statistics
      addSummarySection(doc, users, 'Users');
      
      // User details table
      addUserTable(doc, users);
      
      // Add footer
      addReportFooter(doc);
      
      doc.end();
      
      doc.on('end', () => {
        resolve(filepath);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function generateJobReport(jobs, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `job-report-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '..', 'temp', filename);
      
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add logo and header
      addReportHeader(doc, 'JOB MANAGEMENT REPORT');
      
      // Add filter information
      addFilterSection(doc, filters);
      
      // Summary statistics
      addSummarySection(doc, jobs, 'Jobs');
      
      // Job details table
      addJobTable(doc, jobs);
      
      // Add footer
      addReportFooter(doc);
      
      doc.end();
      
      doc.on('end', () => {
        resolve(filepath);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function generateCustomReport(data, title, fields, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `custom-report-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '..', 'temp', filename);
      
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add logo and header
      addReportHeader(doc, title);
      
      // Add filter information
      addFilterSection(doc, filters);
      
      // Summary statistics
      addSummarySection(doc, data, 'Records');
      
      // Custom table
      addCustomTable(doc, data, fields);
      
      // Add footer
      addReportFooter(doc);
      
      doc.end();
      
      doc.on('end', () => {
        resolve(filepath);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function addReportHeader(doc, title) {
  // Logo placeholder - in a real app, you'd use your actual logo
  doc.image(path.join(__dirname, 'logo.png'), 50, 45, { width: 50 })
     .fillColor('#444444');
  
  // Company info
  doc.fontSize(20).text('ResiLinked', 110, 50);
  doc.fontSize(10).text('123 Main Street, Barangay 1', 110, 70);
  doc.fontSize(10).text('City, Philippines 1000', 110, 85);
  
  // Report title
  doc.fontSize(16).text(title, 50, 120);
  
  // Horizontal line
  doc.moveTo(50, 140).lineTo(550, 140).stroke();
}

function addFilterSection(doc, filters) {
  if (Object.keys(filters).length === 0) return;
  
  doc.y = 150;
  doc.fontSize(12).font('Helvetica-Bold').text('APPLIED FILTERS:', 50, doc.y);
  doc.y += 20;
  
  doc.font('Helvetica');
  let filterText = '';
  
  if (filters.search) filterText += `Search: ${filters.search}\n`;
  if (filters.userType) filterText += `User Type: ${filters.userType}\n`;
  if (filters.barangay) filterText += `Barangay: ${filters.barangay}\n`;
  if (filters.verified !== undefined) filterText += `Verified: ${filters.verified ? 'Yes' : 'No'}\n`;
  if (filters.status) filterText += `Status: ${filters.status}\n`;
  if (filters.minPrice) filterText += `Min Price: ₱${filters.minPrice}\n`;
  if (filters.maxPrice) filterText += `Max Price: ₱${filters.maxPrice}\n`;
  if (filters.minRating) filterText += `Min Rating: ${filters.minRating} stars\n`;
  if (filters.maxRating) filterText += `Max Rating: ${filters.maxRating} stars\n`;
  if (filters.startDate) filterText += `Start Date: ${new Date(filters.startDate).toLocaleDateString()}\n`;
  if (filters.endDate) filterText += `End Date: ${new Date(filters.endDate).toLocaleDateString()}\n`;
  
  doc.fontSize(10).text(filterText, 50, doc.y);
  doc.y += filterText.split('\n').length * 15 + 10;
  
  // Horizontal line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.y += 20;
}

function addSummarySection(doc, data, dataType) {
  doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY STATISTICS:', 50, doc.y);
  doc.y += 20;
  
  let summaryText = '';
  
  if (dataType === 'Users') {
    const total = data.length;
    const verified = data.filter(u => u.isVerified).length;
    const employees = data.filter(u => u.userType === 'employee').length;
    const employers = data.filter(u => u.userType === 'employer').length;
    const both = data.filter(u => u.userType === 'both').length;
    
    summaryText = `Total ${dataType}: ${total}\n` +
                 `Verified: ${verified} (${Math.round((verified / total) * 100)}%)\n` +
                 `Employees: ${employees}\n` +
                 `Employers: ${employers}\n` +
                 `Both: ${both}`;
  } else if (dataType === 'Jobs') {
    const total = data.length;
    const open = data.filter(j => j.status === 'open').length;
    const assigned = data.filter(j => j.status === 'assigned').length;
    const completed = data.filter(j => j.status === 'completed').length;
    const cancelled = data.filter(j => j.status === 'cancelled').length;
    
    summaryText = `Total ${dataType}: ${total}\n` +
                 `Open: ${open}\n` +
                 `Assigned: ${assigned}\n` +
                 `Completed: ${completed}\n` +
                 `Cancelled: ${cancelled}`;
  } else {
    summaryText = `Total ${dataType}: ${data.length}`;
  }
  
  doc.font('Helvetica').fontSize(10).text(summaryText, 50, doc.y);
  doc.y += summaryText.split('\n').length * 15 + 20;
}

function addUserTable(doc, users) {
  doc.fontSize(12).font('Helvetica-Bold').text('USER DETAILS:', 50, doc.y);
  doc.y += 20;
  
  const tableTop = doc.y;
  const leftMargin = 50;
  const colWidths = [80, 100, 120, 80, 60, 60];
  
  // Table headers
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Name', leftMargin, tableTop);
  doc.text('Email', leftMargin + colWidths[0], tableTop);
  doc.text('Contact', leftMargin + colWidths[0] + colWidths[1], tableTop);
  doc.text('Type', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
  doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
  doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
  
  let y = tableTop + 20;
  
  // Horizontal line
  doc.moveTo(leftMargin, y - 5).lineTo(leftMargin + colWidths.reduce((a, b) => a + b, 0), y - 5).stroke();
  
  // Table rows
  doc.font('Helvetica');
  users.forEach((user, i) => {
    if (y > 700) { // Add new page if needed
      doc.addPage();
      y = 50;
      // Add headers again on new page
      doc.font('Helvetica-Bold');
      doc.text('Name', leftMargin, y);
      doc.text('Email', leftMargin + colWidths[0], y);
      doc.text('Contact', leftMargin + colWidths[0] + colWidths[1], y);
      doc.text('Type', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
      doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
      doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
      y += 20;
      doc.font('Helvetica');
    }
    
    doc.fontSize(8).text(`${user.firstName} ${user.lastName}`, leftMargin, y);
    doc.text(user.email, leftMargin + colWidths[0], y);
    doc.text(user.mobileNo || 'N/A', leftMargin + colWidths[0] + colWidths[1], y);
    doc.text(user.userType, leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
    doc.text(user.barangay || 'N/A', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
    doc.text(user.isVerified ? 'Verified' : 'Unverified', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
    
    y += 15;
    
    // Add horizontal line every 5 rows for better readability
    if (i % 5 === 4) {
      doc.moveTo(leftMargin, y - 2).lineTo(leftMargin + colWidths.reduce((a, b) => a + b, 0), y - 2).stroke();
      y += 5;
    }
  });
}

function addJobTable(doc, jobs) {
  doc.fontSize(12).font('Helvetica-Bold').text('JOB DETAILS:', 50, doc.y);
  doc.y += 20;
  
  const tableTop = doc.y;
  const leftMargin = 50;
  const colWidths = [100, 120, 60, 80, 80, 60];
  
  // Table headers
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Title', leftMargin, tableTop);
  doc.text('Description', leftMargin + colWidths[0], tableTop);
  doc.text('Price', leftMargin + colWidths[0] + colWidths[1], tableTop);
  doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
  doc.text('Posted By', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
  doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
  
  let y = tableTop + 20;
  
  // Horizontal line
  doc.moveTo(leftMargin, y - 5).lineTo(leftMargin + colWidths.reduce((a, b) => a + b, 0), y - 5).stroke();
  
  // Table rows
  doc.font('Helvetica');
  jobs.forEach((job, i) => {
    if (y > 700) { // Add new page if needed
      doc.addPage();
      y = 50;
      // Add headers again on new page
      doc.font('Helvetica-Bold');
      doc.text('Title', leftMargin, y);
      doc.text('Description', leftMargin + colWidths[0], y);
      doc.text('Price', leftMargin + colWidths[0] + colWidths[1], y);
      doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
      doc.text('Posted By', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
      doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
      y += 20;
      doc.font('Helvetica');
    }
    
    const description = job.description && job.description.length > 30 
      ? job.description.substring(0, 30) + '...' 
      : job.description || 'N/A';
    
    const postedBy = job.postedBy 
      ? `${job.postedBy.firstName} ${job.postedBy.lastName}` 
      : 'Unknown';
    
    doc.fontSize(8).text(job.title, leftMargin, y);
    doc.text(description, leftMargin + colWidths[0], y);
    doc.text(`₱${job.price}`, leftMargin + colWidths[0] + colWidths[1], y);
    doc.text(job.barangay || 'N/A', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
    doc.text(postedBy, leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
    doc.text(job.status || 'Unknown', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
    
    y += 15;
    
    // Add horizontal line every 5 rows for better readability
    if (i % 5 === 4) {
      doc.moveTo(leftMargin, y - 2).lineTo(leftMargin + colWidths.reduce((a, b) => a + b, 0), y - 2).stroke();
      y += 5;
    }
  });
}

function addCustomTable(doc, data, fields) {
  doc.fontSize(12).font('Helvetica-Bold').text('DETAILS:', 50, doc.y);
  doc.y += 20;
  
  const tableTop = doc.y;
  const leftMargin = 50;
  const colWidth = (500 - leftMargin) / fields.length;
  
  // Table headers
  doc.fontSize(10).font('Helvetica-Bold');
  fields.forEach((field, i) => {
    doc.text(field.label, leftMargin + (i * colWidth), tableTop, {
      width: colWidth,
      align: 'left'
    });
  });
  
  let y = tableTop + 20;
  
  // Horizontal line
  doc.moveTo(leftMargin, y - 5).lineTo(leftMargin + (colWidth * fields.length), y - 5).stroke();
  
  // Table rows
  doc.font('Helvetica');
  data.forEach((item, i) => {
    if (y > 700) { // Add new page if needed
      doc.addPage();
      y = 50;
      // Add headers again on new page
      doc.font('Helvetica-Bold');
      fields.forEach((field, i) => {
        doc.text(field.label, leftMargin + (i * colWidth), y, {
          width: colWidth,
          align: 'left'
        });
      });
      y += 20;
      doc.font('Helvetica');
    }
    
    fields.forEach((field, j) => {
      const value = field.key.split('.').reduce((obj, key) => obj && obj[key], item);
      const displayValue = value !== undefined && value !== null ? value.toString() : 'N/A';
      
      doc.fontSize(8).text(displayValue, leftMargin + (j * colWidth), y, {
        width: colWidth,
        align: 'left'
      });
    });
    
    y += 15;
    
    // Add horizontal line every 5 rows for better readability
    if (i % 5 === 4) {
      doc.moveTo(leftMargin, y - 2).lineTo(leftMargin + (colWidth * fields.length), y - 2).stroke();
      y += 5;
    }
  });
}

function addReportFooter(doc) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 50;
  
  doc.fontSize(8).text(
    `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    50,
    footerY,
    { align: 'left' }
  );
  
  doc.text(
    `Page ${doc.bufferedPageRange().count} of ${doc.bufferedPageRange().count}`,
    50,
    footerY + 15,
    { align: 'left' }
  );
  
  doc.text(
    'ResiLinked - Connecting Skilled Workers with Local Opportunities',
    50,
    footerY,
    { align: 'right' }
  );
}

module.exports = { 
  generateUserReport, 
  generateJobReport, 
  generateCustomReport 
};