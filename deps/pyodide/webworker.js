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
          stdout: (msg) => console.log(`Pyodide: ${msg}`),
        });
        await self.pyodide.loadPackagesFromImports(data.python);
      }
      let results = self.pyodide.runPython(data.python);
      self.postMessage({ results });
    } catch (e) {
      self.postMessage({ error: e.message + "\n" + e.stack });
    }
  };
} else {
  console.error('This script must be run in a Web Worker context');
}