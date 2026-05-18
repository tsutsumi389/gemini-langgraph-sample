import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const CONVERSATIONS_URL = "http://localhost:8000/conversations";

export const defaultHandlers = [
  http.get(CONVERSATIONS_URL, () => HttpResponse.json([])),
  http.get(`${CONVERSATIONS_URL}/:id`, () => new HttpResponse(null, { status: 404 })),
  http.delete(`${CONVERSATIONS_URL}/:id`, () => new HttpResponse(null, { status: 204 })),
];

export const server = setupServer(...defaultHandlers);
