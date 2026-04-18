import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import exec from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js';

const customErrorRate = new Rate('custom_error_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const LOGIN_EMAIL = __ENV.K6_EMAIL || 'qa.user@example.com';
const LOGIN_PASSWORD = __ENV.K6_PASSWORD || 'ChangeMe123!';

const MOCK_PDF_CONTENT = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 40 90 Td (K6 Mock PDF Payload) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000064 00000 n 
0000000121 00000 n 
0000000209 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
317
%%EOF`;

export const options = {
    scenarios: {
        backend_engine_stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 },
                { duration: '3m', target: 50 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
        custom_error_rate: ['rate<0.01'],
    },
};

const parseJson = (response) => {
    try {
        return response.json();
    } catch {
        return null;
    }
};

const loginAndGetToken = () => {
    const response = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: LOGIN_EMAIL,
            password: LOGIN_PASSWORD,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
            tags: { endpoint: 'auth_login' },
        }
    );

    const success = check(response, {
        'login status is 200': (res) => res.status === 200,
        'login response has token': (res) => Boolean(parseJson(res)?.token),
    });

    customErrorRate.add(!success);

    if (!success) return null;

    return parseJson(response)?.token || null;
};

const hitAnalytics = (token) => {
    const response = http.get(`${BASE_URL}/api/analytics/mastery`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        tags: { endpoint: 'analytics_mastery' },
    });

    const success = check(response, {
        'analytics status is 200': (res) => res.status === 200,
    });

    customErrorRate.add(!success);
};

const postIngestMockPdf = (token) => {
    const formData = {
        file: http.file(
            MOCK_PDF_CONTENT,
            `k6-mock-${exec.vu.idInTest}-${Date.now()}.pdf`,
            'application/pdf'
        ),
    };

    const response = http.post(`${BASE_URL}/api/ingest`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        tags: { endpoint: 'ingest_pdf' },
    });

    const success = check(response, {
        'ingest status is 201': (res) => res.status === 201,
    });

    customErrorRate.add(!success);
};

export default function () {
    const token = loginAndGetToken();
    if (!token) {
        sleep(1);
        return;
    }

    hitAnalytics(token);
    postIngestMockPdf(token);

    sleep(1);
}

export function handleSummary(data) {
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
