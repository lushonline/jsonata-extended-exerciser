import * as prettier from 'prettier';
import * as prettierPlugin from '@stedi/prettier-plugin-jsonata';

const jsonataFormatProvider = (prettierOptions = {}) => ({
  provideDocumentFormattingEdits(model, options, token) {
    const formatted = prettier.format(model.getValue(), {
      parser: 'JSONata',
      plugins: [prettierPlugin],
      ...prettierOptions,
    });

    return [
      {
        text: formatted,
        range: model.getFullModelRange(),
      },
    ];
  },
});

export default jsonataFormatProvider;
