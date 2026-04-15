const request = require("supertest");
const express = require("express");

//
const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running ✅" });
});

describe("Health Check", () => {
  it("should return 200 and status message", async () => {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body.status).toBe("Server is running ✅");
  });

  it("should return JSON content type", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect("Content-Type", /json/);

    expect(response.status).toBe(200);
  });
});

describe("Unknown Routes", () => {
  it("should handle unknown routes", async () => {
    await request(app).get("/api/nonexistent").expect(404);
  });
});
