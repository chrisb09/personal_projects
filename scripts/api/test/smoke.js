const { spawn } = require('child_process');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

const localPort = 3199;
const externalUrl = process.env.PORTFOLIO_API_URL;
const baseUrl = (externalUrl || `http://127.0.0.1:${localPort}`).replace(/\/+$/, '');
const username = process.env.PORTFOLIO_API_USER || 'smoke';
const password = process.env.PORTFOLIO_API_PASSWORD || 'smoke-password';
const basic = Buffer.from(`${username}:${password}`).toString('base64');

let pass = 0;
let fail = 0;

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`PASS ${name}${detail ? ` :: ${detail}` : ''}`);
  } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

async function waitForHealth(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return true;
    } catch {
      // Retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function api(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Basic ${basic}`,
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

async function main() {
  let child = null;
  if (!externalUrl) {
    child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PORTFOLIO_API_PORT: String(localPort),
        PORTFOLIO_API_HOST: '127.0.0.1',
        PORTFOLIO_API_USER: username,
        PORTFOLIO_API_PASSWORD: password,
        PORTFOLIO_API_PUBLIC_BASE_URL: `http://127.0.0.1:${localPort}`,
      },
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }

  try {
    const healthy = await waitForHealth(baseUrl);
    check('health endpoint', healthy);
    if (!healthy) throw new Error('Server did not become healthy.');

    const unauthorized = await fetch(`${baseUrl}/api/portfolio/v1/projects`);
    check('unauthenticated request is rejected', unauthorized.status === 401, String(unauthorized.status));

    const projects = await api('/api/portfolio/v1/projects?limit=3');
    check('project list', projects.response.ok && projects.body.projects.length === 3, `${projects.body.count} total`);

    const project = await api('/api/portfolio/v1/projects/exam-system-backend');
    check('project details', project.response.ok && project.body.id === 'exam-system-backend');
    check('project documents', (project.body.documents || []).length === 4);

    const documents = await api('/api/portfolio/v1/projects/exam-system-backend/documents');
    check('document manifest', documents.response.ok && documents.body.count === 4);

    const pdfText = await api('/api/portfolio/v1/projects/exam-system-backend/documents/requirements.pdf/text?maxChars=1200');
    check('PDF text extraction', pdfText.response.ok && pdfText.body.text.includes('REQUIREMENTS DOCUMENT'), `${pdfText.body.pages} pages`);

    const search = await api('/api/portfolio/v1/search?q=checkpoint&limit=3');
    check('document search', search.response.ok && search.body.documents.length > 0, `${search.body.documentCount} documents`);

    const repos = await api('/api/portfolio/v1/repos');
    check('repository list', repos.response.ok && repos.body.repos.length > 0, `${repos.body.count} repos`);

    const context = await api('/api/portfolio/v1/context');
    check('context catalog', context.response.ok && context.body.documents.length > 0, `${context.body.documents.length} documents`);

    const traversal = await api('/api/portfolio/v1/repos/firecord/file?path=../../etc/passwd');
    check('path traversal blocked', traversal.response.status === 400, String(traversal.response.status));

    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
      requestInit: { headers: { Authorization: `Basic ${basic}` } },
    });
    const client = new Client({ name: 'portfolio-smoke', version: '1.0.0' });
    await client.connect(transport);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    check('MCP tools listed', toolNames.includes('list_projects') && toolNames.includes('read_document'), `${toolNames.length} tools`);

    const mcpProjects = await client.callTool({ name: 'list_projects', arguments: { limit: 2 } });
    const mcpText = mcpProjects.content?.find((item) => item.type === 'text')?.text || '';
    const mcpJson = JSON.parse(mcpText);
    check('MCP list_projects', mcpJson.projects.length === 2);

    const mcpDocument = await client.callTool({
      name: 'read_document',
      arguments: { projectId: 'exam-system-backend', file: 'requirements.pdf', maxChars: 1200 },
    });
    const mcpDocumentText = mcpDocument.content?.find((item) => item.type === 'text')?.text || '';
    check('MCP read_document', mcpDocumentText.includes('REQUIREMENTS DOCUMENT'));

    await client.close();
  } finally {
    if (child) child.kill('SIGTERM');
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
