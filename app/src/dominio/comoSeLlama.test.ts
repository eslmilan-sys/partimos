/**
 * Les cas viennent des vraies lignes de la base au 23-08-2026 : « Albrook »,
 * « Chitré · Parque Unión », « Vía España », « Coronado ». Si un jour la
 * découverte réaffiche « Albrook » au lieu de « Ciudad de Panamá », c'est ici
 * que ça se voit.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { ciudadYPunto, soloCiudad, soloPunto } from './comoSeLlama.ts';

const PANAMA = 'Ciudad de Panamá';

test('la découverte dit la ville, jamais le quartier', () => {
  assert.equal(soloCiudad(PANAMA, 'Albrook'), PANAMA);
  assert.equal(soloCiudad(PANAMA, 'Vía España'), PANAMA);
  assert.equal(soloCiudad('Chitré', 'Chitré · Parque Unión'), 'Chitré');
});

test('sans ville connue on retombe sur l’étiquette, jamais sur du vide', () => {
  assert.equal(soloCiudad(null, 'Chitré · Terminal'), 'Chitré');
  assert.equal(soloCiudad('', 'Albrook'), 'Albrook');
  assert.equal(soloCiudad(undefined, undefined), '');
});

test('la page d’offres dit ville · point exact', () => {
  assert.equal(ciudadYPunto(PANAMA, 'Albrook'), 'Ciudad de Panamá · Albrook');
  assert.equal(ciudadYPunto(PANAMA, 'Vía España'), 'Ciudad de Panamá · Vía España');
});

test('la ville n’apparaît jamais deux fois', () => {
  assert.equal(ciudadYPunto('Chitré', 'Chitré · Parque Unión'), 'Chitré · Parque Unión');
  assert.equal(ciudadYPunto('Coronado', 'Coronado'), 'Coronado');
});

test('une étiquette à trois morceaux ne déborde pas', () => {
  assert.equal(ciudadYPunto(PANAMA, 'Albrook · Terminal'), 'Ciudad de Panamá · Albrook');
});

test('sans ville, l’étiquette part telle quelle', () => {
  assert.equal(ciudadYPunto(null, 'Albrook · Terminal'), 'Albrook · Terminal');
  assert.equal(ciudadYPunto('Chitré', ''), 'Chitré');
});

test('le point seul, pour la ligne qui vit sous sa ville', () => {
  assert.equal(soloPunto(PANAMA, 'Albrook'), 'Albrook');
  assert.equal(soloPunto('Chitré', 'Chitré · Parque Unión'), 'Parque Unión');
  assert.equal(soloPunto('Coronado', 'Coronado'), 'Coronado');
  assert.equal(soloPunto(PANAMA, ''), '');
});
