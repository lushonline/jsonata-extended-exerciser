import React from 'react';
import _ from 'lodash';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import JSONEditorWithNav from './components/JSONEditorWithNav';
import JSONATAEditorWithNav from './components/JSONATAEditorWithNav';

import MainNav from './components/MainNav';
import './exerciserbootstrap.css';

import packageJson from '../package.json';

import sampledata from './data/sampledata';
import transforms from './data/transforms';

const version = packageJson.version;

class ExerciserBootstrap extends React.Component {
  constructor(props) {
    super(props);

    this.tabsOnSelect = this.tabsOnSelect.bind(this);

    // Get transforms and configurations from window object
    const dataexamples = transforms;

    // Remove Workday
    this.sources = dataexamples.transforms
      .map((value, index, sourceArray) => {
        const newObj = {};
        newObj.id = value.id;
        newObj.name = `${value.name}`;
        newObj.type = value.jsondata;
        newObj.transform = `${value.transform}`;
        newObj.jsonatabinding = {};
        return newObj;
      })
      .reduce((accumulator, currentValue, index, sourcearray) => {
        accumulator[currentValue.id] = currentValue;
        return accumulator;
      }, {});

    this.defaults = {
      empty: {
        id: 'empty',
        name: 'Empty',
        type: 'empty',
        transform: `$.{}`,
        jsonatabinding: {},
      },
    };

    this.sources = {
      ...this.defaults,
      ...this.sources,
    };

    this.sampledata = sampledata;

    this.data = {
      json: JSON.stringify({}, null, 2),
      transform: `$.{}`,
      jsonatabinding: JSON.stringify({}, null, 2),
      result: null,
    };
  }

  componentDidMount() {
    this.loadJSONata();
    this.eval();
  }

  tabsOnSelect(eventKey, event) {
    this.jsonEditor.layout();
    this.jsonataEditor.layout();
    this.jsonatabindingEditor.layout();
    this.resultsEditor.layout();
  }

  editorOverwrite(editor, value) {
    if (editor) {
      editor.setValue(value);
    }
  }

  allEditorsOverwrite() {
    this.editorOverwrite(this.jsonEditor, this.data.json);
    this.editorOverwrite(this.jsonataEditor, this.data.transform);
    this.editorOverwrite(this.jsonatabindingEditor, this.data.jsonatabinding);
    this.editorOverwrite(this.resultsEditor, this.data.results);
  }

  jsonEditorDidMount(editor, monaco) {
    this.jsonEditor = editor;
    this.editorOverwrite(this.jsonEditor, this.data.json);
  }

  jsonataEditorDidMount(editor, monaco) {
    this.jsonataEditor = editor;
    this.editorOverwrite(this.jsonataEditor, this.data.transform);
  }

  jsonatabindingEditorDidMount(editor, monaco) {
    this.jsonatabindingEditor = editor;
    this.editorOverwrite(this.jsonatabindingEditor, this.data.jsonatabinding);
  }

  resultsEditorDidMount(editor, monaco) {
    this.resultsEditor = editor;
    this.editorOverwrite(this.resultsEditor, this.data.result);
  }

  onChangeData(newValue, e) {
    this.data.json = newValue;
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 750);
    this.clearMarkers();
  }

  onChangeTransform(newValue, e) {
    this.data.transform = newValue;
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 750);
    this.clearMarkers();
  }

  onChangeBindingconfig(newValue, e) {
    this.data.jsonatabinding = newValue;
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 750);
    this.clearMarkers();
  }

  loadJSONata() {
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/npm/jsonata/jsonata.min.js';

    const scriptextended = document.createElement('script');
    scriptextended.type = 'text/javascript';
    scriptextended.src =
      'https://cdn.jsdelivr.net/npm/jsonata-extended/dist/jsonata-extended.min.js';
    this.local = false;
    head.appendChild(script);
    head.appendChild(scriptextended);
  }

  changeData(eventkey, event) {
    const selected = this.sources[eventkey];
    this.data = {
      json: JSON.stringify(this.sampledata[selected.type], null, 2),
      transform: selected.transform,
      jsonatabinding: JSON.stringify(selected.jsonatabinding || {}, null, 2),
    };
    this.allEditorsOverwrite();
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 100);
    this.clearMarkers();
  }

  async eval() {
    let input, jsonataResult, jsonatabinding, binding;

    if (typeof window.jsonataExtended === 'undefined') {
      this.timer = setTimeout(this.eval.bind(this), 750);
      return;
    }

    try {
      input = JSON.parse(this.data.json);
    } catch (err) {
      this.data.results = `ERROR IN INPUT JSON DATA: ${err.message}`;
      this.jsonEditor.addErrorDecorationFromErr(err);
      return;
    }

    try {
      jsonatabinding = JSON.parse(this.data.jsonatabinding);
    } catch (err) {
      this.data.results = `ERROR IN BINDING JSON DATA: ${err.message}`;
      this.jsonatabindingEditor.addErrorDecorationFromErr(err);
      return;
    }

    binding = _.merge({}, jsonatabinding);

    try {
      if (this.data.transform !== '') {
        jsonataResult = this.evalJsonata(input, binding);
        if (this.isPromise(jsonataResult)) {
          jsonataResult = await jsonataResult;
        }
        this.data.results = jsonataResult;
      }
    } catch (err) {
      this.data.results = err.message || String(err);
      this.jsonataEditor.addErrorDecorationFromErr(err);
    }
    this.editorOverwrite(this.resultsEditor, this.data.results);
  }

  clearMarkers() {
    this.jsonataEditor.clearDecorations();
    this.jsonatabindingEditor.clearDecorations();
    this.jsonEditor.clearDecorations();
  }

  isPromise(value) {
    return !!(
      value &&
      value.then &&
      typeof value.then === 'function' &&
      value?.constructor?.name === 'Promise'
    );
  }

  async evalJsonata(input, binding) {
    const expr = window.jsonataExtended(this.data.transform);

    expr.assign('trace', function (arg) {
      console.log(arg);
    });

    if (!this.local) {
      this.timeboxExpression(expr, 3000, 750);
    }

    let pathresult = {};
    pathresult = expr.evaluate(input, binding);
    if (this.isPromise(pathresult)) {
      pathresult = await pathresult;
    }
    if (typeof pathresult === 'undefined') {
      pathresult = '** no match **';
    } else {
      pathresult = JSON.stringify(
        pathresult,
        function (key, val) {
          return typeof val !== 'undefined' && val !== null && val.toPrecision
            ? Number(val.toPrecision(13))
            : val && (val._jsonata_lambda === true || val._jsonata_function === true)
            ? '{function:' + (val.signature ? val.signature.definition : '') + '}'
            : typeof val === 'function'
            ? '<native function>#' + val.length
            : val;
        },
        2
      );
    }
    return pathresult;
  }

  timeboxExpression(expr, timeout, maxDepth) {
    let depth = 0;
    const time = Date.now();

    const checkRunnaway = function () {
      if (depth > maxDepth) {
        // stack too deep
        // eslint-disable-next-line  no-throw-literal
        throw {
          code: 'U1001',
          message:
            'Stack overflow error: Check for non-terminating recursive function.  Consider rewriting as tail-recursive.',
          stack: new Error().stack,
        };
      }
      if (Date.now() - time > timeout) {
        // expression has run for too long
        // eslint-disable-next-line  no-throw-literal
        throw {
          code: 'U1002',
          message: 'Expression evaluation timeout: Check for infinite loop',
          stack: new Error().stack,
        };
      }
    };

    // register callbacks
    expr.assign('__evaluate_entry', function () {
      depth++;
      checkRunnaway();
    });
    expr.assign('__evaluate_exit', function () {
      depth--;
      checkRunnaway();
    });
  }

  render() {
    const options = {
      minimap: { enabled: false },
      lineNumbers: 'off',
      contextmenu: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      extraEditorClassName: 'editor-pane',
    };

    const resultsoptions = {
      lineNumbers: 'off',
      minimap: { enabled: false },
      automaticLayout: true,
      contextmenu: true,
      scrollBeyondLastLine: false,
      readOnly: true,
      extraEditorClassName: 'result-pane',
    };

    return (
      <Container fluid>
        <MainNav
          sources={this.sources}
          onSourceSelect={this.changeData.bind(this)}
          version={version}
        />
        <Row>
          <Col>
            <Tabs
              defaultActiveKey="transform"
              transition={false}
              id="transform-config"
              onSelect={this.tabsOnSelect}
            >
              <Tab eventKey="transform" title="Transform" className="border">
                <JSONATAEditorWithNav
                  language="jsonata"
                  theme="jsonataTheme"
                  options={options}
                  onChange={this.onChangeTransform.bind(this)}
                  editorDidMount={this.jsonataEditorDidMount.bind(this)}
                  label="Transform"
                  formatEnabled={true}
                />
              </Tab>
              <Tab eventKey="jsonatabinding" title="Binding" className="border">
                <JSONEditorWithNav
                  language="json"
                  options={options}
                  onChange={this.onChangeBindingconfig.bind(this)}
                  editorDidMount={this.jsonatabindingEditorDidMount.bind(this)}
                  label="Binding"
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
        <Row>
          <Col>
            <Tabs defaultActiveKey="results" transition={false} id="transform-data">
              <Tab eventKey="source" title="Source Data" className="border">
                <JSONEditorWithNav
                  language="json"
                  options={options}
                  onChange={this.onChangeData.bind(this)}
                  editorDidMount={this.jsonEditorDidMount.bind(this)}
                  label="Source Data"
                />
              </Tab>
              <Tab eventKey="results" title="Results" className="border">
                <JSONEditorWithNav
                  language="json"
                  options={resultsoptions}
                  editorDidMount={this.resultsEditorDidMount.bind(this)}
                  label="Results"
                  downloadCSVEnabled={true}
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ExerciserBootstrap;
