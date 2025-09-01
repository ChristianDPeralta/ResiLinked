const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateUserReport(users) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filename = `user-report-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '..', 'temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text('ResiLinked User Report', 100, 100);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);
      doc.moveDown(2);

      // Summary statistics
      doc.fontSize(16).text('Summary Statistics', 100, doc.y);
      doc.moveDown();

      const totalUsers = users.length;
      const verifiedUsers = users.filter(u => u.isVerified).length;
      const employeeUsers = users.filter(u => u.userType === 'employee').length;
      const employerUsers = users.filter(u => u.userType === 'employer').length;
      const bothUsers = users.filter(u => u.userType === 'both').length;

      doc.fontSize(12).text(`Total Users: ${totalUsers}`, 100, doc.y);
      doc.text(`Verified Users: ${verifiedUsers} (${Math.round((verifiedUsers / totalUsers) * 100)}%)`, 100, doc.y + 20);
      doc.text(`Employees: ${employeeUsers}`, 100, doc.y + 40);
      doc.text(`Employers: ${employerUsers}`, 100, doc.y + 60);
      doc.text(`Both: ${bothUsers}`, 100, doc.y + 80);
      doc.moveDown(2);

      // User details table
      doc.fontSize(16).text('User Details', 100, doc.y);
      doc.moveDown();

      let y = doc.y;
      const leftMargin = 100;
      const colWidths = [150, 150, 120, 100, 80];

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Name', leftMargin, y);
      doc.text('Email', leftMargin + colWidths[0], y);
      doc.text('User Type', leftMargin + colWidths[0] + colWidths[1], y);
      doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
      doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);

      y += 20;
      doc.moveTo(leftMargin, y).lineTo(leftMargin + colWidths.reduce((a, b) => a + b, 0), y).stroke();
      y += 10;

      // Table rows
      doc.font('Helvetica');
      users.forEach(user => {
        if (y > 700) {
          doc.addPage();
          y = 100;
          doc.font('Helvetica-Bold');
          doc.text('Name', leftMargin, y);
          doc.text('Email', leftMargin + colWidths[0], y);
          doc.text('User Type', leftMargin + colWidths[0] + colWidths[1], y);
          doc.text('Barangay', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
          doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
          y += 30;
          doc.font('Helvetica');
        }

        doc.fontSize(8).text(`${user.firstName} ${user.lastName}`, leftMargin, y);
        doc.text(user.email, leftMargin + colWidths[0], y);
        doc.text(user.userType, leftMargin + colWidths[0] + colWidths[1], y);
        doc.text(user.barangay || 'N/A', leftMargin + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text(user.isVerified ? 'Verified' : 'Unverified', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);

        y += 15;
      });

      doc.end();

      // Resolve when PDF is finished
      stream.on('finish', () => resolve(filepath));
      doc.on('error', reject);
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateUserReport };
