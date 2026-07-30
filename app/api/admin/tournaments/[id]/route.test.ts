import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const findByIdAndUpdateMock = vi.fn();

vi.mock("@/lib/auth/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/db/connect", () => ({
  dbConnect: vi.fn(),
}));

vi.mock("@/lib/db/models", () => ({
  Tournament: { findByIdAndUpdate: (...args: unknown[]) => findByIdAndUpdateMock(...args) },
  Match: {},
  Startup: {},
  Vote: {},
}));

import { PATCH } from "./route";

const VALID_ID = "507f1f77bcf86cd799439011";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/admin/tournaments/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    findByIdAndUpdateMock.mockReset();
  });

  it("returns 401 when the session user is not an admin", async () => {
    authMock.mockResolvedValue({ user: { role: "founder" } });
    const res = await PATCH(new Request("http://test"), makeParams(VALID_ID));
    expect(res.status).toBe(401);
    expect(findByIdAndUpdateMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid id", async () => {
    authMock.mockResolvedValue({ user: { role: "admin" } });
    const res = await PATCH(new Request("http://test"), makeParams("not-an-id"));
    expect(res.status).toBe(400);
    expect(findByIdAndUpdateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the tournament doesn't exist", async () => {
    authMock.mockResolvedValue({ user: { role: "admin" } });
    findByIdAndUpdateMock.mockResolvedValue(null);
    const res = await PATCH(new Request("http://test"), makeParams(VALID_ID));
    expect(res.status).toBe(404);
  });

  it("unsets champion and returns 200 for a valid admin request", async () => {
    authMock.mockResolvedValue({ user: { role: "admin" } });
    findByIdAndUpdateMock.mockResolvedValue({ _id: VALID_ID });
    const res = await PATCH(new Request("http://test"), makeParams(VALID_ID));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(VALID_ID, { $unset: { champion: 1 } });
  });
});
