#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://docker.standard.mybahmni.in';
const PATIENT_UUID = 'ef56c955-2106-418f-8982-f82a4cafeaab';
const USERNAME = 'superman';
const PASSWORD = 'Admin123';

const AUTH_HEADER = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

const DOCUMENTS = [
  { fileName: 'PatientHistory1', filePath: 'test-data/common/patientHistory.pdf', fileType: 'pdf', format: 'pdf', contentType: 'application/pdf' },
  { fileName: 'Prescription1', filePath: 'test-data/common/prescription.png', fileType: 'image', format: 'png', contentType: 'image/png' },
  { fileName: 'PatientPhoto', filePath: 'test-data/common/patient-photo.png', fileType: 'image', format: 'png', contentType: 'image/png' },
  { fileName: 'PatientHistory2', filePath: 'test-data/common/patientHistory.pdf', fileType: 'pdf', format: 'pdf', contentType: 'application/pdf' },
  { fileName: 'Prescription2', filePath: 'test-data/common/prescription.png', fileType: 'image', format: 'png', contentType: 'image/png' },
];

function makeRequest(method, urlPath, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${urlPath}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function uploadDocument(doc) {
  const absolutePath = path.resolve(doc.filePath);
  const fileContent = fs.readFileSync(absolutePath);
  const base64Content = fileContent.toString('base64');

  console.log(`  Uploading file: ${doc.fileName}...`);
  const result = await makeRequest('POST', '/openmrs/ws/rest/v1/bahmnicore/visitDocument/uploadDocument', {
    content: base64Content,
    encounterTypeName: 'Patient Document',
    fileName: doc.fileName,
    fileType: doc.fileType,
    format: doc.format,
    patientUuid: PATIENT_UUID,
  });

  return result.url;
}

async function createDocumentReference(contentType, url, docName) {
  console.log(`  Creating DocumentReference for: ${docName}...`);
  await makeRequest('POST', '/openmrs/ws/fhir2/R4/DocumentReference', {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    subject: { reference: `Patient/${PATIENT_UUID}` },
    masterIdentifier: { value: 'patientImageAndHistory' },
    type: {
      coding: [{ code: '94ea9aba-a82c-4e54-9c11-722d97ae54b8', display: 'PatientFile' }],
    },
    date: new Date().toISOString(),
    content: [{ attachment: { contentType, url } }],
  });
}

async function main() {
  console.log(`Uploading 5 document references for patient: ${PATIENT_UUID}`);
  console.log(`Target: ${BASE_URL}\n`);

  for (let i = 0; i < DOCUMENTS.length; i++) {
    const doc = DOCUMENTS[i];
    console.log(`[${i + 1}/5] Processing: ${doc.fileName}`);
    try {
      const url = await uploadDocument(doc);
      await createDocumentReference(doc.contentType, url, doc.fileName);
      console.log(`  Done.\n`);
    } catch (err) {
      console.error(`  Failed: ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log('All 5 document references uploaded successfully.');
  console.log(`View at: ${BASE_URL}/bahmni-v2/clinical/${PATIENT_UUID}`);
}

main();
