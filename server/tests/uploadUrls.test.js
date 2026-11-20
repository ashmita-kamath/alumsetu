import { test } from "node:test";
import assert from "node:assert/strict";

process.env.CLOUDINARY_URL ||= "cloudinary://key:secret@demo";
const { withoutSignature, signedUrl } = await import("../src/services/uploadService.js");

const SIGNED = "https://res.cloudinary.com/demo/image/authenticated/s--Ab_C1-23--/v17/alumsetu/verification/abc.pdf";
const PLAIN = "https://res.cloudinary.com/demo/image/authenticated/v17/alumsetu/verification/abc.pdf";

test("the permanent signature is removed from private links", () => {
  assert.equal(withoutSignature(SIGNED), PLAIN);
  assert.equal(withoutSignature(PLAIN), PLAIN);
});

test("public links (resumes) are left alone", () => {
  const resume = "https://res.cloudinary.com/demo/image/upload/v1/alumsetu/resumes/r.pdf";
  assert.equal(withoutSignature(resume), resume);
});

test("admins get a short-lived download link, also for links stored with a signature", () => {
  for (const stored of [PLAIN, SIGNED]) {
    const link = signedUrl(stored);
    assert.match(link, /api\.cloudinary\.com\/v1_1\/demo\/image\/download/);
    assert.match(link, /public_id=alumsetu%2Fverification%2Fabc/);
    assert.match(link, /expires_at=\d+/);
  }
});
