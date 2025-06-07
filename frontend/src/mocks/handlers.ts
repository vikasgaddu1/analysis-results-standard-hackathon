import { http, HttpResponse } from 'msw';
import { 
  createMockUser, 
  createMockAnalysis, 
  createMockMethod,
  createMockOutput,
  createMockWhereClause 
} from '../test-utils/test-utils';

const API_URL = 'http://localhost:8000/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.formData();
    const username = body.get('username');
    const password = body.get('password');

    if (username === 'testuser' && password === 'testpassword') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
      });
    }

    return HttpResponse.json(
      { detail: 'Incorrect username or password' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockUser({
        email: body.email,
        username: body.username,
        fullName: body.full_name,
      }),
      { status: 201 }
    );
  }),

  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }

    return HttpResponse.json(createMockUser());
  }),

  // Analysis endpoints
  http.get(`${API_URL}/analyses`, () => {
    return HttpResponse.json([
      createMockAnalysis({ id: 'AN001', name: 'Analysis 1' }),
      createMockAnalysis({ id: 'AN002', name: 'Analysis 2' }),
      createMockAnalysis({ id: 'AN003', name: 'Analysis 3' }),
    ]);
  }),

  http.get(`${API_URL}/analyses/:id`, ({ params }) => {
    const { id } = params;
    
    if (id === 'nonexistent') {
      return HttpResponse.json(
        { detail: 'Analysis not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(createMockAnalysis({ id: id as string }));
  }),

  http.post(`${API_URL}/analyses`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockAnalysis({
        ...body,
        id: body.id || 'AN_NEW',
        createdAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.patch(`${API_URL}/analyses/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    
    return HttpResponse.json(
      createMockAnalysis({
        id: id as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete(`${API_URL}/analyses/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Method endpoints
  http.get(`${API_URL}/methods`, () => {
    return HttpResponse.json([
      createMockMethod({ id: 'METHOD001', name: 'Mean' }),
      createMockMethod({ id: 'METHOD002', name: 'Median' }),
      createMockMethod({ id: 'METHOD003', name: 'Count' }),
    ]);
  }),

  http.get(`${API_URL}/methods/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockMethod({ id: id as string }));
  }),

  http.post(`${API_URL}/methods`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockMethod({
        ...body,
        id: body.id || 'METHOD_NEW',
      }),
      { status: 201 }
    );
  }),

  // Output endpoints
  http.get(`${API_URL}/outputs`, () => {
    return HttpResponse.json([
      createMockOutput({ id: 'OUT001', name: 'Table 1' }),
      createMockOutput({ id: 'OUT002', name: 'Table 2' }),
    ]);
  }),

  http.get(`${API_URL}/outputs/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockOutput({ id: id as string }));
  }),

  http.post(`${API_URL}/outputs`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockOutput({
        ...body,
        id: body.id || 'OUT_NEW',
      }),
      { status: 201 }
    );
  }),

  // Where clause endpoints
  http.get(`${API_URL}/where-clauses`, () => {
    return HttpResponse.json([
      createMockWhereClause({ id: 'WC001', label: 'ITT Population' }),
      createMockWhereClause({ id: 'WC002', label: 'Safety Population' }),
    ]);
  }),

  http.get(`${API_URL}/where-clauses/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockWhereClause({ id: id as string }));
  }),

  http.post(`${API_URL}/where-clauses`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(
      createMockWhereClause({
        ...body,
        id: body.id || 'WC_NEW',
      }),
      { status: 201 }
    );
  }),

  // Validation endpoint
  http.post(`${API_URL}/validation/validate`, async ({ request }) => {
    const body = await request.json() as any;
    
    // Mock validation response
    return HttpResponse.json({
      isValid: true,
      errors: [],
      warnings: [],
      info: ['Validation completed successfully'],
    });
  }),

  // Import/Export endpoints
  http.post(`${API_URL}/import-export/import`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return HttpResponse.json(
        { detail: 'No file provided' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      message: 'Import successful',
      imported: {
        reportingEvents: 1,
        analyses: 5,
        methods: 3,
        outputs: 2,
      },
    });
  }),

  http.post(`${API_URL}/import-export/export`, async ({ request }) => {
    const body = await request.json() as any;
    
    // Return mock export data
    const mockData = {
      reportingEvents: [{ id: 'RE001', name: 'Test RE' }],
      analyses: [createMockAnalysis()],
      methods: [createMockMethod()],
      outputs: [createMockOutput()],
    };

    if (body.format === 'json') {
      return HttpResponse.json(mockData);
    } else {
      // For other formats, return a blob
      return new HttpResponse(
        new Blob([JSON.stringify(mockData)], { type: 'application/octet-stream' }),
        {
          headers: {
            'Content-Disposition': `attachment; filename="export.${body.format}"`,
          },
        }
      );
    }
  }),
];