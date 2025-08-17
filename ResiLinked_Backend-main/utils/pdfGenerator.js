const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a simple PDF report of users.
 * @param {Array} users - Array of User objects
 * @param {string} filename - Output file path
 * @returns {string} Path to the PDF file
 */
function generateUserReport(users, filename = 'users-report.pdf') {
    const doc = new PDFDocument();
    const filepath = path.join(__dirname, '..', filename);
    doc.pipe(fs.createWriteStream(filepath));
    doc.fontSize(18).text('ResiLinked User Report', { align: 'center' });
    doc.moveDown();

    users.forEach(u => {
        doc.fontSize(12).text(
            `Name: ${u.firstName} ${u.lastName}\nEmail: ${u.email}\nBarangay: ${u.barangay}\nSkills: ${u.skills.join(', ')}\nUserType: ${u.userType}\nGender: ${u.gender}\n`
        );
        doc.moveDown();
    });
    doc.end();
    return filepath;
}

/**
 * Generate a simple PDF report of jobs.
 * @param {Array} jobs - Array of Job objects
 * @param {string} filename - Output file path
 * @returns {string} Path to the PDF file
 */
function generateJobReport(jobs, filename = 'jobs-report.pdf') {
    const doc = new PDFDocument();
    const filepath = path.join(__dirname, '..', filename);
    doc.pipe(fs.createWriteStream(filepath));
    doc.fontSize(18).text('ResiLinked Job Report', { align: 'center' });
    doc.moveDown();

    jobs.forEach(j => {
        doc.fontSize(12).text(
            `Title: ${j.title}\nDescription: ${j.description}\nBarangay: ${j.barangay}\nSkills Required: ${j.skillsRequired.join(', ')}\nEmployer: ${j.employer?.email || j.employer}\nStatus: ${j.isOpen ? 'Open' : 'Closed'}\n`
        );
        doc.moveDown();
    });
    doc.end();
    return filepath;
}

/**
 * Generate a simple PDF report of ratings.
 * @param {Array} ratings - Array of Rating objects
 * @param {string} filename - Output file path
 * @returns {string} Path to the PDF file
 */
function generateRatingReport(ratings, filename = 'ratings-report.pdf') {
    const doc = new PDFDocument();
    const filepath = path.join(__dirname, '..', filename);
    doc.pipe(fs.createWriteStream(filepath));
    doc.fontSize(18).text('ResiLinked Ratings Report', { align: 'center' });
    doc.moveDown();

    ratings.forEach(r => {
        doc.fontSize(12).text(
            `Rated User: ${r.ratedUser?.email || r.ratedUser}\nRater: ${r.rater?.email || r.rater}\nJob: ${r.job?.title || r.job}\nScore: ${r.score}\nComment: ${r.comment}\nDate: ${r.createdAt?.toLocaleString() || r.createdAt}\n`
        );
        doc.moveDown();
    });
    doc.end();
    return filepath;
}

/**
 * Generate a simple PDF report of reports (user reports/complaints).
 * @param {Array} reports - Array of Report objects
 * @param {string} filename - Output file path
 * @returns {string} Path to the PDF file
 */
function generateUserReportReports(reports, filename = 'user-reports-report.pdf') {
    const doc = new PDFDocument();
    const filepath = path.join(__dirname, '..', filename);
    doc.pipe(fs.createWriteStream(filepath));
    doc.fontSize(18).text('ResiLinked User Reports', { align: 'center' });
    doc.moveDown();

    reports.forEach(rep => {
        doc.fontSize(12).text(
            `Reported User: ${rep.reportedUser?.email || rep.reportedUser}\nReporter: ${rep.reporter?.email || rep.reporter}\nReason: ${rep.reason}\nStatus: ${rep.status}\nDate: ${rep.createdAt?.toLocaleString() || rep.createdAt}\n`
        );
        doc.moveDown();
    });
    doc.end();
    return filepath;
}

module.exports = {
    generateUserReport,
    generateJobReport,
    generateRatingReport,
    generateUserReportReports
};