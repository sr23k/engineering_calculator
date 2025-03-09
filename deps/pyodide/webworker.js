if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {

  importScripts("./pyodide.js");
  self.onmessage = async function (e) {
    try {
      const data = e.data;
  
      if (!self.pyodide) {
        self.pyodide = await loadPyodide({
          packages: ['sympy'],
          stdout: (msg) => {
            self.postMessage({ type: 'output', result: msg });
          },
          fullStdLib: false
        });
        await self.pyodide.loadPackagesFromImports(data.python);
        self.pyodide.runPython("from sympy import *");
        self.pyodide.runPython("from sympy.physics.units import *");
        self.pyodide.runPython("import sympy")
        self.pyodide.runPython("");
        self.quantity_globals = self.pyodide.runPython("dict()");
        self.units = self.pyodide.runPython("dir(sympy.physics.units)");
        self.hasQuantity = self.pyodide.runPython(`def hasQuantity(x):
    y = sympify(x)
    return type(y) == Expr and y.has(Quantity)
hasQuantity`);
        self.pyodide.runPython("del hasQuantity")
        self.simplify_quantity = self.pyodide.runPython(`from sympy import *
from sympy.physics.units import *
from sympy.physics.units.util import quantity_simplify, convert_to
from sympy.parsing.sympy_parser import parse_expr
def pre(expr):
    ret = []
    if(expr.args):
        for arg in expr.args:
            if(isinstance(arg, Quantity)):
                ret.append(arg)
            else:
                ret.append(pre(arg))
    return flatten(ret)
def simplify_quantity(final_expr, starting_expr):
    sol = quantity_simplify(final_expr, across_dimensions = True, unit_system = "SI")
    starting_units = {x.dimension:x for x in pre(parse_expr(starting_expr, global_dict = globals(), transformations = "all", evaluate = False))[::-1]}
    ending_units = {x.dimension:x for x in sol.find(Quantity)}
    matched_units = {starting_units[x] for x in starting_units if x in ending_units}
    for i in matched_units:
        sol = convert_to(sol, i)
    return sol
simplify_quantity`, {globals: self.quantity_globals});
        self.parse_expr = self.pyodide.runPython(`def parse(expr):
    try:
        return parse_expr(expr, global_dict = globals(), transformations = "all", evaluate = False)
    except:
        return eval(expr)
parse`)
        self.pyodide.runPython("del parse")
        self.print= self.pyodide.runPython("print")
        self.latex = self.pyodide.runPython("latex")
        self.init_globals = self.pyodide.runPython("list(map(str, globals().keys()))").toJs({create_pyproxies : false});
        self.postMessage({ type: 'status', status: 'initialized' });
      }
      if(data.clear){
        cur_globals = self.pyodide.runPython("list(map(str, globals().keys()))").toJs({create_pyproxies : false});
        diff_globals = cur_globals.filter(x => !self.init_globals.includes(x))
        diff_globals.forEach(x => self.pyodide.runPython(`del ${x}`))
      }
      if(data.python){
        let results = self.parse_expr(data.python);
        if(self.hasQuantity(results)){
          results = self.simplify_quantity(results, data.python)
        }
        self.print(self.latex(results))
        results.destroy()
      }
    } catch (e) {
      console.log(e.stack)
      self.postMessage({ type: 'error', error: e.message, error_type: e.type});
    }
  };
} else {
  console.error('This script must be run in a Web Worker context');
}