import React from 'react';
import ExerciserBootstrap from './ExerciserBootstrap';

function App() {
  const queryParams = new URLSearchParams(window.location.search);

  return <ExerciserBootstrap showall={queryParams.get('showall') === 'true'} />;
}

export default App;
