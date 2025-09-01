const User = require('../models/User');
const Job = require('../models/Job');
const Rating = require('../models/Rating');
const { generateUserReport } = require('../utils/pdfGenerator');

// Helper function to convert data to CSV format
function convertToCSV(data, fields) {
  if (!data || data.length === 0) return '';
  
  const headers = fields.map(field => `"${field.label}"`).join(',');
  const rows = data.map(item => {
    return fields.map(field => {
      // Handle nested properties
      const value = field.key.split('.').reduce((obj, key) => obj && obj[key], item);
      return `"${value !== undefined && value !== null ? value.toString().replace(/"/g, '""') : ''}"`;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.query;
    
    let data;
    let filename;
    let fields;
    
    switch (type) {
      case 'users':
        data = await User.find().select('-password -verificationToken -verificationExpires');
        filename = `resilinked-users-${new Date().toISOString().split('T')[0]}`;
        fields = [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
          { key: 'mobileNo', label: 'Mobile Number' },
          { key: 'userType', label: 'User Type' },
          { key: 'barangay', label: 'Barangay' },
          { key: 'isVerified', label: 'Verified' },
          { key: 'createdAt', label: 'Registration Date' }
        ];
        break;
        
      case 'jobs':
        data = await Job.find().populate('postedBy', 'firstName lastName email');
        filename = `resilinked-jobs-${new Date().toISOString().split('T')[0]}`;
        fields = [
          { key: 'title', label: 'Job Title' },
          { key: 'description', label: 'Description' },
          { key: 'price', label: 'Price' },
          { key: 'barangay', label: 'Barangay' },
          { key: 'status', label: 'Status' },
          { key: 'postedBy.firstName', label: 'Posted By First Name' },
          { key: 'postedBy.lastName', label: 'Posted By Last Name' },
          { key: 'createdAt', label: 'Posted Date' }
        ];
        break;
        
      case 'ratings':
        data = await Rating.find()
          .populate('rater', 'firstName lastName')
          .populate('ratee', 'firstName lastName');
        filename = `resilinked-ratings-${new Date().toISOString().split('T')[0]}`;
        fields = [
          { key: 'rating', label: 'Rating' },
          { key: 'comment', label: 'Comment' },
          { key: 'rater.firstName', label: 'Rater First Name' },
          { key: 'rater.lastName', label: 'Rater Last Name' },
          { key: 'ratee.firstName', label: 'Rated User First Name' },
          { key: 'ratee.lastName', label: 'Rated User Last Name' },
          { key: 'createdAt', label: 'Rating Date' }
        ];
        break;
        
      default:
        return res.status(400).json({ message: "Invalid export type" });
    }
    
    if (format === 'csv') {
      const csv = convertToCSV(data, fields);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else if (format === 'pdf') {
      if (type === 'users') {
        const pdfPath = await generateUserReport(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return res.download(pdfPath, () => {
          // Clean up the temporary file
          require('fs').unlinkSync(pdfPath);
        });
      } else {
        return res.status(400).json({ message: "PDF export only available for users" });
      }
    } else {
      return res.status(400).json({ message: "Unsupported format" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error exporting data",
      error: err.message
    });
  }
};