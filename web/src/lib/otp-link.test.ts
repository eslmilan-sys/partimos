import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readPastedAuth } from "./otp-link.ts";

/**
 * Le seul chemin d'entrée du site. S'il se trompe, personne n'a de compte.
 * On teste ce que les gens collent VRAIMENT : un code lu à voix haute, un
 * code recopié avec un tiret, un lien pris dans Mail avec sa ponctuation
 * autour, et une redirection déjà faite.
 */

const REF = "https://abcdefgh.supabase.co";

test("seis dígitos son un código", () => {
  assert.deepEqual(readPastedAuth("482913"), { kind: "code", token: "482913" });
});

test("un código copiado con espacios o guion sigue siendo un código", () => {
  assert.deepEqual(readPastedAuth(" 482 913 "), {
    kind: "code",
    token: "482913",
  });
  assert.deepEqual(readPastedAuth("482-913"), {
    kind: "code",
    token: "482913",
  });
});

test("el enlace del correo lleva el token_hash bajo el nombre `token`", () => {
  const p = readPastedAuth(
    `${REF}/auth/v1/verify?token=abc123hash&type=signup&redirect_to=https%3A%2F%2Fx.com`,
  );
  assert.deepEqual(p, { kind: "hash", tokenHash: "abc123hash", type: "signup" });
});

test("también acepta el nombre moderno token_hash", () => {
  const p = readPastedAuth(`${REF}/auth/v1/verify?token_hash=zzz&type=magiclink`);
  assert.deepEqual(p, { kind: "hash", tokenHash: "zzz", type: "magiclink" });
});

test("un enlace pegado desde Mail, con puntuación alrededor", () => {
  const p = readPastedAuth(
    `<${REF}/auth/v1/verify?token=abc&type=email>.`,
  );
  assert.deepEqual(p, { kind: "hash", tokenHash: "abc", type: "email" });
});

test("la redirección ya hecha trae la sesión en el hash", () => {
  const p = readPastedAuth(
    "https://eslmilan-sys.github.io/test/partimos/#access_token=AAA&refresh_token=BBB&type=magiclink",
  );
  assert.deepEqual(p, {
    kind: "session",
    accessToken: "AAA",
    refreshToken: "BBB",
  });
});

test("el flujo PKCE devuelve un code para intercambiar", () => {
  const p = readPastedAuth(
    "https://eslmilan-sys.github.io/test/partimos/?code=xyz-123",
  );
  assert.deepEqual(p, { kind: "pkce", code: "xyz-123" });
});

test("lo que no es ninguna de esas cosas no se inventa", () => {
  assert.equal(readPastedAuth("").kind, "nada");
  assert.equal(readPastedAuth("hola").kind, "nada");
  assert.equal(readPastedAuth("12345").kind, "nada");
  assert.equal(readPastedAuth("https://partimos.com/ayuda").kind, "nada");
});

test("un tipo de OTP desconocido no pasa por token_hash", () => {
  assert.equal(
    readPastedAuth(`${REF}/auth/v1/verify?token=abc&type=inventado`).kind,
    "nada",
  );
});
