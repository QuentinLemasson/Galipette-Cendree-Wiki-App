// Mock Next.js response
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.init = init;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
};

// Mock Next.js NextResponse
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: (body, init) => new Response(JSON.stringify(body), init),
    },
    NextRequest: class NextRequest {
      constructor(url) {
        this.url = url;
      }
    },
  };
});
