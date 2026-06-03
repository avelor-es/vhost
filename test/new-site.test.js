import { test }        from 'node:test'
import assert          from 'node:assert/strict'
import { parseAliases } from '../src/new-site.js'

test('parseAliases — null returns empty array', () => {
  assert.deepEqual(parseAliases(null), [])
})

test('parseAliases — empty string returns empty array', () => {
  assert.deepEqual(parseAliases(''), [])
})

test('parseAliases — single alias', () => {
  assert.deepEqual(parseAliases('www.example.com'), ['www.example.com'])
})

test('parseAliases — comma-separated (flag style)', () => {
  assert.deepEqual(parseAliases('a.com,b.com'), ['a.com', 'b.com'])
})

test('parseAliases — space-separated (interactive style)', () => {
  assert.deepEqual(parseAliases('a.com b.com'), ['a.com', 'b.com'])
})

test('parseAliases — comma with surrounding spaces', () => {
  assert.deepEqual(parseAliases('a.com, b.com'), ['a.com', 'b.com'])
})

test('parseAliases — mixed comma and spaces', () => {
  assert.deepEqual(parseAliases('a.com, b.com c.com'), ['a.com', 'b.com', 'c.com'])
})

test('parseAliases — trailing comma is ignored', () => {
  assert.deepEqual(parseAliases('a.com,'), ['a.com'])
})

test('parseAliases — multiple spaces between aliases', () => {
  assert.deepEqual(parseAliases('a.com   b.com'), ['a.com', 'b.com'])
})
