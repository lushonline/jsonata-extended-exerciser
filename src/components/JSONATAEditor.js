import React from 'react';
import { Range } from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoEditor from 'react-monaco-editor';
import PropTypes from 'prop-types';
import { accessSafe } from 'access-safe';
import { v4 as uuidv4 } from 'uuid';

import registerJsonataLanguage from './monacoIntegration/jsonata';

class JSONATAEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: this.props.height || '100%',
      width: this.props.width || '100%',
      filename: `${accessSafe(() => this.props.label, 'filename')}.jsonata`.toLowerCase(),
      language: 'jsonata',
    };
    this.editorDidMount = this.editorDidMount.bind(this);
    this.editorWillMount = this.editorWillMount.bind(this);
    this.onChange = this.onChange.bind(this);
    this.editor = null;
    this.monaco = null;
  }

  /**
   *
   *
   * @param {*} newValue
   * @param {*} e
   * @memberof JSONATAEditor
   */
  onChange = (newValue, e) => {
    // Bubble up the event
    if (this.props.onChange) {
      this.props.onChange(newValue, e);
    }
  };

  /**
   *
   *
   * @param {*} monaco
   * @memberof JSONATAEditor
   */
  editorWillMount = (monaco) => {
    this.monaco = monaco;

    registerJsonataLanguage(monaco);
    // Bubble up the event
    if (this.props.editorWillMount) {
      this.props.editorWillMount(monaco);
    }
  };

  /**
   *
   *
   * @param {*} editor
   * @param {*} monaco
   * @memberof JSONATAEditor
   */
  editorDidMount = (editor, monaco) => {
    this.editor = editor;
    monaco.editor.setModelLanguage(editor.getModel(), 'jsonata');
    editor.addAction({
      id: 'jsonata-lambda',
      label: 'Lambda',
      keybindings: [monaco.KeyCode.F11],
      run: function (ed) {
        ed.trigger('keyboard', 'type', { text: 'λ' });
        return null;
      },
    });
    // Bubble up the event
    if (this.props.editorDidMount) {
      this.props.editorDidMount(this, monaco);
    }
  };

  /**
   * Get the Monaco Editor
   *
   * @return {object|null}
   * @memberof JSONATAEditor
   */
  getEditor() {
    return accessSafe(() => this.editor, null);
  }

  /**
   * Clear any decorations from editor
   *
   */
  clearDecorations() {
    const editor = this.getEditor();
    if (editor) {
      editor.decorations = editor.deltaDecorations(editor.decorations || [], []);
    }
  }

  /**
   * Add an error decoration based on start and end position
   *
   * @param {integer} start
   * @param {integer} end
   */
  addErrorDecoration(start, end) {
    const editor = this.getEditor();
    if (editor && start !== end) {
      const buffer = this.getValue();
      const resolve = (offset) => {
        let line = 1;
        let column = 1;
        let position = 1;
        while (position < offset) {
          if (buffer.charAt(position) === '\n') {
            line++;
            column = 0;
          } else {
            column++;
          }
          position++;
        }
        return { line, column };
      };
      const from = resolve(start);
      const to = resolve(end);
      editor.decorations = editor.deltaDecorations(editor.decorations, [
        {
          range: new Range(from.line, from.column, to.line, to.column),
          options: { inlineClassName: 'errorMarker' },
        },
        {
          range: new Range(from.line, 1, to.line, 1),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'errorMargin',
          },
        },
      ]);
    }
  }

  /**
   * Add an error decoration based on extracting position from
   * err
   *
   * @param {*} err
   */
  addErrorDecorationFromErr(err) {
    let start = 0;
    let end = 0;

    end = err.position + 1;
    start = end - (err.token ? err.token.length : 1);

    this.addErrorDecoration(start, end);
  }

  /**
   * Get the Monaco Editor Model
   *
   * @return {ITextModel|null}
   * @memberof JSONATAEditor
   */
  getModel() {
    return accessSafe(() => this.getEditor().getModel(), null);
  }

  /**
   * Get the Monaco Editor Model value
   *
   * @return {string}
   * @memberof JSONATAEditor
   */
  getValue() {
    return accessSafe(() => this.getModel().getValue(), null);
  }

  /**
   * Run the Monaco Editor formatDocument Action
   *
   * @return {}
   * @memberof JSONATAEditor
   */
  format() {
    this.getEditor().getAction('editor.action.formatDocument').run();
  }

  /**
   * Set the Monaco Editor Model values
   *
   * @param {string} value
   * @memberof JSONATAEditor
   */
  setValue = (newValue) => {
    const model = this.getModel();
    if (model) {
      model.applyEdits([
        {
          range: new this.monaco.Range(
            1,
            1,
            model.getLineCount(),
            model.getLineMaxColumn(model.getLineCount())
          ),
          text: newValue,
        },
      ]);
    }
    this.format();
  };

  /**
   * Instructs the editor to remeasure its container. This method should
   * be called when the container of the editor gets resized.
   *
   * If a dimension is passed in, the passed in value will be used.
   *
   *
   * @param {Object} [dimensions=null] - The dimensions.
   * @param {number} [dimensions.width] - The width.
   * @param {number} [dimensions.height] - The height.
   * @memberof JSONATAEditor
   */
  layout(dimensions = null) {
    if (this.getEditor()) {
      this.getEditor().layout(dimensions);
    }
  }

  /**
   * Resize the editor
   *
   * @param {number} width
   * @param {number} height
   * @memberof JSONATAEditor
   */
  resize = (width, height) => {
    this.setState({
      width,
      height,
    });
    this.layout({ width, height });
  };

  render() {
    const { height, width, language } = this.state;

    const { value, label, options = {}, editorDidMount, className, id, ...other } = this.props;

    return (
      <div className={className}>
        <MonacoEditor
          id={id}
          key={id + '-jsonataeditor'}
          height={height}
          width={width}
          language={language}
          value={value}
          options={{
            ...options,
          }}
          {...other}
          onChange={this.onChange}
          editorDidMount={this.editorDidMount}
          editorWillMount={this.editorWillMount}
        />
      </div>
    );
  }
}

JSONATAEditor.propTypes = {
  editorDidMount: PropTypes.func,
  editorWillMount: PropTypes.func,
  onChange: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string,
  label: PropTypes.string,
  options: PropTypes.object,
  className: PropTypes.string,
  id: PropTypes.string,
};

JSONATAEditor.defaultProps = {
  editorDidMount: () => {},
  editorWillMount: () => {},
  onChange: () => {},
  height: '100%',
  width: '100%',
  label: 'JSONata Editor',
  options: {},
  className: 'resizable-editor',
  id: uuidv4(),
};

export default JSONATAEditor;
