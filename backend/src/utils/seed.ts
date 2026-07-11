import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from '../models/user';
import Student from '../models/student';
import AuditLog from '../models/auditLog';

dotenv.config();

// Simple CSV parser for node
function parseCSVFile(filePath: string): any[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Find header line
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Find index of expected headers
    const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
    const admIdx = headers.findIndex(h => h.toLowerCase().includes('admission'));
    const deptIdx = headers.findIndex(h => h.toLowerCase() === 'department');

    if (nameIdx === -1 || admIdx === -1 || deptIdx === -1) {
      console.warn(`Skipping ${path.basename(filePath)}: Missing required columns. Headers found:`, headers);
      return [];
    }

    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes in CSV values
      const values: string[] = [];
      let insideQuote = false;
      let entry = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      values.push(entry.trim());

      const name = values[nameIdx]?.replace(/^"|"$/g, '') || '';
      const admissionNumber = values[admIdx]?.replace(/^"|"$/g, '').toUpperCase() || '';
      const department = values[deptIdx]?.replace(/^"|"$/g, '') || '';

      if (name && admissionNumber && department) {
        records.push({
          name,
          admissionNumber,
          department,
        });
      }
    }
    return records;
  } catch (err: any) {
    console.error(`Error reading ${filePath}:`, err.message);
    return [];
  }
}

async function runSeed() {
  const connStr = process.env.MONGODB_URI;
  if (!connStr) {
    console.error('MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(connStr);
  console.log('Connected to MongoDB.');

  // Clear students and audit logs
  await Student.deleteMany({});
  await AuditLog.deleteMany({});
  console.log('Cleared existing student records.');

  // Reseed users to make sure logins are active
  await User.deleteMany({});
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('9984673006', salt);
  const editorPassword = await bcrypt.hash('Editor@123', salt);
  const markerPassword = await bcrypt.hash('Marker@123', salt);
  const watcherPassword = await bcrypt.hash('Watcher@123', salt);

  await User.create([
    { username: 'LokeshAdmin', password: adminPassword, role: 'Admin' },
    { username: 'editor1', password: editorPassword, role: 'Editor' },
    { username: 'marker1', password: markerPassword, role: 'Marker' },
    { username: 'watcher1', password: watcherPassword, role: 'Watcher' },
  ]);
  console.log('Reseeded users: LokeshAdmin, editor1, marker1, watcher1');

  // Read all CSV files in backend directory
  const backendDir = __dirname; // backend/src/utils
  const rootBackendDir = path.resolve(backendDir, '../..'); // backend/
  console.log('Scanning for CSV files in:', rootBackendDir);

  const files = fs.readdirSync(rootBackendDir);
  const csvFiles = files.filter(f => f.endsWith('.csv'));
  console.log(`Found ${csvFiles.length} CSV files:`, csvFiles);

  let totalParsed = 0;
  const allStudents: any[] = [];
  const processedAdmissions = new Set<string>();

  for (const csvFile of csvFiles) {
    const fullPath = path.join(rootBackendDir, csvFile);
    console.log(`Parsing ${csvFile}...`);
    const records = parseCSVFile(fullPath);
    console.log(`Parsed ${records.length} records from ${csvFile}`);
    
    for (const record of records) {
      if (processedAdmissions.has(record.admissionNumber)) {
        // Skip duplicate admission numbers
        continue;
      }
      processedAdmissions.add(record.admissionNumber);
      
      allStudents.push({
        name: record.name,
        admissionNumber: record.admissionNumber,
        department: record.department,
        contactStatus: 'Not Contacted',
        supportStatus: 'Unknown',
        voteStatus: 'Not Voted',
        probabilityScore: 30,
        influenceScore: 0,
        remarks: '',
      });
    }
    totalParsed += records.length;
  }

  console.log(`Total unique students to insert: ${allStudents.length} (out of ${totalParsed} total rows)`);

  // Insert in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < allStudents.length; i += batchSize) {
    const batch = allStudents.slice(i, i + batchSize);
    // Use Student.create to trigger pre-save hook for year calculations
    await Student.create(batch);
    console.log(`Inserted ${i + batch.length} / ${allStudents.length} students...`);
  }

  console.log('Database seeding from real CSV files finished successfully!');
  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
