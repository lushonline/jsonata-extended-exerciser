/**
 * © Copyright IBM Corp. 2016, 2020 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 *
 * Enhanced by Martin Holden
 */

import React from 'react';
import sampledata from './data/sampledata';
import transforms from './data/transforms';
import _ from 'lodash';
import EnhancedMonacoEditorWithNav from './components/EnhancedEditorWithNav';
import MainNav from './components/MainNav';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import './exerciserbootstrap.css';
import { version } from '../package.json';

class ExerciserBootstrap extends React.Component {
  constructor(props) {
    super(props);

    // Get transforms and configurations from window object
    const dataexamples = transforms;

    // Remove Workday
    this.sources = dataexamples.transforms
      .map((value, index, sourceArray) => {
        const newObj = {};
        newObj.id = value.id;
        newObj.name = `${value.name}`;
        newObj.type = value.jsondata;
        newObj.jsonata = `${value.transform}`;
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
        jsonata: `$.{}`,
        jsonatabinding: {},
      },
    };

    this.sources = {
      ...this.defaults,
      ...this.sources,
    };

    this.data = {
      json: JSON.stringify({}, null, 2),
      jsonata: `$.{}`,
      jsonatabinding: JSON.stringify({}, null, 2),
      result: null,
    };
  }

  componentDidMount() {
    this.eval();
  }

  editorOverwrite(editor, value) {
    if (editor) {
      editor.updateNoUndo(value);
    }
  }

  allEditorsOverwrite() {
    this.editorOverwrite(this.jsonEditor, this.data.json);
    this.editorOverwrite(this.jsonataEditor, this.data.jsonata);
    this.editorOverwrite(this.jsonatabindingEditor, this.data.jsonatabinding);
    this.editorOverwrite(this.resultsEditor, this.data.results);
  }

  jsonEditorDidMount(editor, monaco) {
    this.jsonEditor = editor;
    this.editorOverwrite(this.jsonEditor, this.data.json);
  }

  jsonataEditorDidMount(editor, monaco) {
    this.jsonataEditor = editor;
    this.editorOverwrite(this.jsonataEditor, this.data.jsonata);
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

  onChangeExpression(newValue, e) {
    this.data.jsonata = newValue;
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 750);
    this.clearMarkers();
  }

  onChangejsonatabinding(newValue, e) {
    this.data.jsonatabinding = newValue;
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 750);
    this.clearMarkers();
  }

  changeData(eventkey, event) {
    const selected = this.sources[eventkey];
    this.data = {
      json: JSON.stringify(sampledata[selected.type], null, 2),
      jsonata: selected.jsonata,
      jsonatabinding: JSON.stringify(selected.jsonatabinding || {}, null, 2),
    };
    this.allEditorsOverwrite();
    clearTimeout(this.timer);
    this.timer = setTimeout(this.eval.bind(this), 100);
    this.clearMarkers();
  }

  eval() {
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
      this.data.results = `ERROR IN BASE CONFIGURATION JSON DATA: ${err.message}`;
      this.jsonatabindingEditor.addErrorDecorationFromErr(err);
      return;
    }

    binding = _.merge({}, jsonatabinding);
    // binding = {};

    try {
      if (this.data.jsonata !== '') {
        jsonataResult = this.evalJsonata(input, binding);
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

  evalJsonata(input, binding) {
    const expr = window.jsonataExtended(this.data.jsonata);

    expr.assign('trace', function (arg) {
      console.log(arg);
    });

    if (!this.local) {
      this.timeboxExpression(expr, 3000, 750);
    }

    let pathresult = expr.evaluate(input, binding);
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
      contextmenu: false,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      extraEditorClassName: 'editor-pane',
    };

    const resultsoptions = {
      lineNumbers: 'off',
      minimap: { enabled: false },
      automaticLayout: true,
      contextmenu: false,
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
            <Tabs defaultActiveKey="transform" transition={false} id="transform-config">
              <Tab eventKey="transform" title="Transform" className="border">
                <EnhancedMonacoEditorWithNav
                  language="jsonata"
                  theme="jsonataTheme"
                  options={options}
                  onChange={this.onChangeExpression.bind(this)}
                  editorDidMount={this.jsonataEditorDidMount.bind(this)}
                  label="Transform"
                  formatEnabled={false}
                />
              </Tab>
              <Tab eventKey="jsonatabinding" title="JSONata Binding" className="border">
                <EnhancedMonacoEditorWithNav
                  language="json"
                  theme="jsonataTheme"
                  options={options}
                  onChange={this.onChangejsonatabinding.bind(this)}
                  editorDidMount={this.jsonatabindingEditorDidMount.bind(this)}
                  label="JSONata Binding"
                  moreinfo="https://docs.jsonata.org/embedding-extending#expressionevaluateinput-bindings-callback"
                  moreinfolabel="More info on binding"
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
        <Row>
          <Col>
            <Tabs defaultActiveKey="results" transition={false} id="transform-data">
              <Tab eventKey="source" title="Source Data" className="border">
                <EnhancedMonacoEditorWithNav
                  language="json"
                  theme="jsonataTheme"
                  options={options}
                  onChange={this.onChangeData.bind(this)}
                  editorDidMount={this.jsonEditorDidMount.bind(this)}
                  label="Source Data"
                />
              </Tab>
              <Tab eventKey="results" title="Results" className="border">
                <EnhancedMonacoEditorWithNav
                  language="json"
                  theme="jsonataTheme"
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
