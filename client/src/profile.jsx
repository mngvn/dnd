import React from 'react';
import { createRoot } from 'react-dom/client';

// Moved into main, cannot define file path offline (change when connected)
// include in index <script type='module' src='/client/src/profile.jsx'></script>
function Profile() {
  return <div>
    <h1>AI DnD Demo---</h1>
    <input value={text} onChange={e=>setText(e.target.value)}/>
    <button onClick={send}>Send</button>
    <pre>{JSON.stringify(log,null,2)}</pre>
  </div>
}

