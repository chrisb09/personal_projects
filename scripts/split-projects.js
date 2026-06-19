const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/config/projects.ts');
const projectsDir = path.join(__dirname, '../projects');

if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

const content = fs.readFileSync(srcPath, 'utf8');

// Find the start of the projects array
const startIndex = content.indexOf('export const projects: Project[] =');
if (startIndex === -1) {
  console.error('Could not find projects array in projects.ts');
  process.exit(1);
}

// Find the opening bracket of the array after the equals sign
const equalsIndex = content.indexOf('=', startIndex);
const arrayContentStart = content.indexOf('[', equalsIndex);
if (arrayContentStart === -1) {
  console.error('Could not find array start [ after =');
  process.exit(1);
}

let openBrackets = 1;
let index = arrayContentStart + 1;

while (openBrackets > 0 && index < content.length) {
  if (content[index] === '[') openBrackets++;
  else if (content[index] === ']') openBrackets--;
  index++;
}

const arrayText = content.substring(arrayContentStart, index);

// Create a clean JS expression by exporting the array
const cleanJs = `const projects = ${arrayText};\nmodule.exports = projects;`;

// Save to a temporary file
const tempJsPath = path.join(__dirname, 'temp-projects.js');
fs.writeFileSync(tempJsPath, cleanJs);

try {
  const projects = require(tempJsPath);
  console.log(`Loaded ${projects.length} projects successfully.`);

  for (const project of projects) {
    const projectId = project.id;
    if (!projectId) {
      console.warn('Skipping project with no ID:', project);
      continue;
    }

    // Check if the project has screenshots to determine if it should be in its own folder
    if (project.screenshots && project.screenshots.length > 0) {
      const projectSubdir = path.join(projectsDir, projectId);
      if (!fs.existsSync(projectSubdir)) {
        fs.mkdirSync(projectSubdir, { recursive: true });
      }
      
      const projectJsonPath = path.join(projectSubdir, 'project.json');
      fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));
      console.log(`Saved directory-based project data to: projects/${projectId}/project.json`);
    } else {
      const projectJsonPath = path.join(projectsDir, `${projectId}.json`);
      fs.writeFileSync(projectJsonPath, JSON.stringify(project, null, 2));
      console.log(`Saved file-based project data to: projects/${projectId}.json`);
    }
  }
} catch (err) {
  console.error('Error parsing projects array:', err);
} finally {
  // Clean up temp file
  if (fs.existsSync(tempJsPath)) {
    fs.unlinkSync(tempJsPath);
  }
}
