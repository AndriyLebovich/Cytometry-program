import { useState } from 'react'

declare global {
  interface Window {
    electronAPI: {
      runPython: (
        command: string,
        data?: unknown
      ) => Promise<string>

      selectFcsFile: () => Promise<string | null>;
    };
  }
}
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [pythonResult, setPythonResult] = useState('')

  const [fcsResult, setFcsResult] = useState<{
  file: string;
  events: number;
  channels: string[];
} | null>(null);

const testFcs = async () => {
  try {
    const filePath = await window.electronAPI.selectFcsFile();

    if (!filePath) {
      console.log("File selection cancelled");
      return;
    }

    console.log("Selected FCS file:", filePath);

    const result = await window.electronAPI.runPython("read_fcs", {
  file_path: filePath,
});

const parsedResult = JSON.parse(result);

console.log("FCS RESULT:", parsedResult);

if (parsedResult.success) {
  setFcsResult(parsedResult);
}
  } catch (error) {
    console.error("FCS ERROR:", error);
  }
};

const runPython = async () => {
  try {
    // test
    const result = await window.electronAPI.runPython("test", {
  message: "Hello from React",
  day: 6,
});
    setPythonResult(result)
  } catch (error) {
    setPythonResult(`error: ${error}`)
  }
}

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>

        <button
          type="button"
          onClick={runPython}
        >
          Start Python 
        </button>

        <button onClick={testFcs}>
          Test FCS
        </button>

        {fcsResult && (
  <div>
    <h2>FCS File</h2>

    <p>
      <strong>File:</strong> {fcsResult.file}
    </p>

    <p>
      <strong>Events:</strong> {fcsResult.events}
    </p>

    <h3>Channels</h3>

    <ul>
      {fcsResult.channels.map((channel) => (
        <li key={channel}>{channel}</li>
      ))}
    </ul>
  </div>
)}

        {pythonResult && (
          <p>
            Result Python: {pythonResult}
          </p>
        )}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
