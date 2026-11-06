import assert from 'node:assert/strict';
import test from 'node:test';

import { createTools } from '../lib/tools.js';

const tools = createTools({});

function byName(name) {
  const tool = tools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} exists`);
  return tool;
}

test('every model-facing tool exposes an object-rooted JSON Schema', () => {
  assert.ok(tools.length > 0);
  for (const tool of tools) {
    assert.equal(tool.parameters.type, 'object', `${tool.name} root type`);
    assert.ok(tool.parameters.properties, `${tool.name} properties`);
    assert.equal(typeof tool.parameters.properties, 'object', `${tool.name} properties object`);
    if ('required' in tool.parameters) {
      assert.ok(Array.isArray(tool.parameters.required), `${tool.name} required array`);
    }
    for (const [name, schema] of Object.entries(tool.parameters.properties)) {
      assert.equal(
        Object.hasOwn(schema, 'required'),
        false,
        `${tool.name}.${name} must not keep the author-only required flag`,
      );
    }
  }
});

test('report_prepare_run sends the required parameters the provider expects', () => {
  const tool = byName('report_prepare_run');
  assert.deepEqual(tool.parameters.required, ['reportPath']);
  assert.deepEqual(Object.keys(tool.parameters.properties), [
    'title',
    'reportPath',
    'outputLang',
    'outputDir',
    'focus',
  ]);
  assert.equal(tool.parameters.properties.title.type, 'string');
  assert.equal(tool.parameters.properties.outputLang.type, 'string');
  assert.deepEqual(tool.parameters.properties.outputLang.enum, [
    'en',
    'zh-Hans',
    'zh-Hant',
    'both',
    'both-hans',
    'both-hant',
  ]);
});

test('every tool keeps a usable execute body and output renderer', () => {
  for (const tool of tools) {
    assert.equal(typeof tool.name, 'string', 'tool name');
    assert.equal(typeof tool.description, 'string', `${tool.name} description`);
    assert.equal(typeof tool.execute, 'function', `${tool.name} execute`);
    assert.equal(typeof tool.output?.render, 'function', `${tool.name} output renderer`);
  }
});
