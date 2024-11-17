// Function to detect unit from an equation
function detectUnit(equation, variable) {
    try {
        const sides = equation.split('==');
        if (sides.length !== 2) return null;
        
        // Store current value if exists

        const oldMap = parser.getAllAsMap();
        newMap = new Map();
        for (const [key, value] of oldMap) {
            if(math.typeOf(value) == "Unit"){
                newMap.set(key, new Dimension(value.dimensions));
            } else {
                newMap.set(key, new Dimension([0, 0, 0, 0, 0, 0, 0, 0, 0]));
            }
        }

        // Try with a simple unit value
        newMap.set(variable, new Dimension([0, 0, 0, 0, 0, 0, 0, 0, 0], variable));
        const left = math.evaluate(sides[0].trim(), newMap);
        const right = math.evaluate(sides[1].trim(), newMap);

        const finalExpression = math.subtract(left, right).var_vals;
        const finalDimension = finalExpression.get(variable)[0];
        const finalPower = finalExpression.get(variable)[1];
        let unit = [`gram^${finalDimension[0]/finalPower}`,
                    `meter^${finalDimension[1]/finalPower}`,
                    `second^${finalDimension[2]/finalPower}`,
                    `ampere^${finalDimension[3]/finalPower}`,
                    `kelvin^${finalDimension[4]/finalPower}`,
                    `candela^${finalDimension[5]/finalPower}`,
                    `mole^${finalDimension[6]/finalPower}`,
                    `deg^${finalDimension[7]/finalPower}`,
                    `bits^${finalDimension[8]/finalPower}`
                ];
        return unit.join(' ') || null;
    } catch (error) {
        throw new Error('Error in variable detection: ' + error.message);
    }
    return null;
}

function splitValueAndUnit(valueWithUnit) {
    const [value, ...unit] = valueWithUnit.toString().split(' ');
    return {
        value: parseFloat(value),
        unit: unit.join(' ') || null
    };
}

function resolveVariableProperties(equation, variable, initialValue = null) {
    let unit;
    let knownUnit = false;
    let parsedInitialValue;

    if (initialValue !== null) {
        const { value, unit: initialUnit } = splitValueAndUnit(initialValue);
        if (initialUnit) {
            unit = initialUnit;
            knownUnit = true;
        }else{
            unit = detectUnit(equation, variable);
        }
        parsedInitialValue = value;
    } else {
        try {
            const currentValue = parser.get(variable);
            const { value, unit: currentUnit } = splitValueAndUnit(currentValue);
            unit = currentUnit;
            parsedInitialValue = value;
        } catch (error) {
            unit = detectUnit(equation, variable);
            parsedInitialValue = 1.0;
        }
    }

    if (!unit) {
        throw new Error('Could not determine units for variable ' + variable);
    }

    // Ensure parsedInitialValue is a number
    if (typeof parsedInitialValue !== 'number') {
        parsedInitialValue = math.evaluate(parsedInitialValue).toNumber();
    }

    return {
        unit,
        knownUnit,
        parsedInitialValue
    };
}

function solveEquation(equationName, variable, initialValue = null) {
    if (!(equationName in equations)) {
        throw new Error(`Equation ${equationName} not found`);
    }
    const equation = equations[equationName];
    const sides = equation.split('==');
    if (sides.length !== 2) {
        throw new Error('Invalid equation format. Use == for equations.');
    }

    // Use the new function to get variable properties
    const { unit, knownUnit, parsedInitialValue } = resolveVariableProperties(equation, variable, initialValue);

    // Rest of the function remains the same...
    const leftSide = sides[0].trim();
    const rightSide = sides[1].trim();

    // Create function that returns the difference between sides
    function evaluateEquation(x) {
        try{
            parser.set(variable, math.unit(x, unit));
            const left = parser.evaluate(leftSide);
            const right = parser.evaluate(rightSide);
            if(right.dimensions || left.dimensions){
                return math.subtract(left, right).toNumber();
            } else {
                return math.subtract(left, right);
            }
        } catch (error){
            throw new Error("Failed to evaluate expression: " + error.message);
        }
    }


    // Newton-Raphson method with unit handling
    function newtonRaphson(f, x0, tolerance = 1e-10, maxIterations = 100) {
        let x = x0;
        for (let i = 0; i < maxIterations; i++) {
            const fx = f(x);
            if (Math.abs(fx) < tolerance) {
                return x;
            }

            // Numerical derivative with appropriate scaling
            const h = Math.max(1e-10, Math.abs(x) * 1e-6);
            const df = (f(x + h) - fx) / h;
            
            if (df === 0) {
                throw new Error('Derivative is zero. Cannot continue.');
            }
            
            const delta = fx / df;
            x = x - delta;
        }
        throw new Error('Failed to converge');
    }
    function parseInputsforPrinting(){
        const oldMap = parser.getAllAsMap();
        parsedEquation = math.parse(equation);
        unitString = parser.evaluate(unit).toString();
        if(unitString){
            const transformed = parsedEquation.transform(function (node, path, parent) {
                if (node.isSymbolNode && node.name !== variable) {
                    return math.parse(parser.evaluate(node.name).toString());
                }
                else if(node.isSymbolNode && node.name === variable){
                    return new math.AssignmentNode(node, math.parse(unitString))
                }
                else {
                    return node
                }
            })
            parsingResult = transformed
            return parsingResult;
        } else{
            return parsedEquation;
        }
    }

    try {
        const parsingResult = parseInputsforPrinting()
        const solution = newtonRaphson(evaluateEquation, parsedInitialValue);
        const result = math.unit(solution, unit);
        if (initialValue !== null){
            return [`\\mathrm{solve}\\left(\\mathrm{${equationName}}, \\mathrm{${variable}}, ${parsedInitialValue}\\right) \\to`,
                    `\\to ${parsingResult.toTex().replaceAll(":=", "\\colonequals")}`,
                    `\\to \\mathrm{${variable}} \\colonequals ${math.parse(result.toString()).toTex()}`,
                    result, parsingResult.toString()];
        } else {
            return [`\\mathrm{solve}\\left(\\mathrm{${equationName}}, \\mathrm{${variable}}\\right) \\to`,
                    `\\to ${parsingResult.toTex().replaceAll(":=", "\\colonequals")}`,
                    `\\to \\mathrm{${variable}} \\colonequals ${math.parse(result.toString()).toTex()}`,
                    result, parsingResult.toString()];
        }
    } catch(error){
        throw new Error(`Failed to solve equation: ${error.message}`);
    }
}