import { useEffect, useState } from 'react';

function App() {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL || 'http://localhost:4000')
      .then(res => res.text())
      .then(setMensaje);
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>{mensaje}</h1>
    </div>
  );
}

export default App;
