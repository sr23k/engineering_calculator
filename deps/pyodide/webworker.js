if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {

  importScripts("./pyodide.js");
  self.onmessage = async function (e) {
    try {
      const data = e.data;
      for (let key of Object.keys(data)) {
        if (key !== "python") {
          self[key] = data[key];
        }
      }
  
      if (!self.pyodide) {
        self.pyodide = await loadPyodide({
          packages: ['sympy'],
          stdout: (msg) => {
            console.log(`Pyodide: ${msg}`);
            self.postMessage({ type: 'output', result: msg });
          },
          fullStdLib: false
        });
        await self.pyodide.loadPackagesFromImports(data.python);
        await self.pyodide.runPythonAsync("from sympy import *");
        await self.pyodide.runPythonAsync("from sympy.physics.units import *");
        await self.pyodide.runPythonAsync("");
        self.postMessage({ type: 'status', status: 'initialized' });
      }
      let results = await self.pyodide.runPythonAsync(data.python);
      self.postMessage({ type: 'result', result: results });
    } catch (e) {
      self.postMessage({ error: e.message + "\n" + e.stack });
    }
  };
} else {
  console.error('This script must be run in a Web Worker context');
}