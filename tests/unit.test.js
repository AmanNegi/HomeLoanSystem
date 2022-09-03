const { User } = require("../models/user");
const mongoose = require("mongoose");
const request = require("supertest");

describe("user.js", () => {
  beforeEach(() => {
    server = require("../index");
  });

  afterEach(() => {
    server.close();
  });

  it("should return ", async () => {
    var res = await request(server).post("/api/login").send({ name: 'aster' });
    console.log(res.body);
    expect(res.status).toBe(200);
  });
});
