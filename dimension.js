try{
    // Constructor function for Dimension class with input validation
    function Dimension(value, variable = null) {
        // Validate that value is an array of length 9
        if(math.typeOf(value) == "DenseMatrix"){
            if(value._size.length !==1){
                throw new Error("Invalid value: Dimension must be a 1-dimensional array")
            }
            value = value._data;
        }
        if (!Array.isArray(value) || value.length !== 9){
            throw new Error("Invalid value: Dimension must be an array of nine numbers.");
        }
        this.value = value;
        this.known = variable === null;
        this.variable = variable;
        this.power = 1;
        this.var_vals = new Map(); // To store variable names and mismatched values
    }
    Dimension.prototype.isDimension = true;

    Dimension.prototype.toString = function () {
        return `Dimension: ${this.value.join(",")}`;
    }

    // define a new datatype
    math.typed.addType({
        name: 'Dimension',
        test: function (x) {
            // test whether x is of type Dimension
            return x && x.isDimension
        }
    })

    // Addition and Subtraction rules for Dimension class
    const add = math.typed('add', {
        'Dimension, Dimension': function (a, b) {
            const result = new Dimension(a.known ? a.value : b.value);

            if (a.known && b.known) {
                // Both known dimensions: values must match
                if (JSON.stringify(a.value) !== JSON.stringify(b.value)) {
                    throw new Error("Incompatible dimensions: values must match for addition/subtraction.");
                }
            } else if (a.known || b.known) {
                // Known and unknown dimension addition
                const known = a.known ? a : b;
                const unknown = a.known ? b : a;
                const difference = known.value.map((v, i) => v - unknown.value[i]);
                result.var_vals.set(unknown.variable, [difference, unknown.power]);
            } else if(a.variable == b.variable){
                if(a.power == -b.power){
                    b.power = -b.power;
                    b.value = b.value.map((val, i) => -val);
                }
                if (JSON.stringify(a.value) !== JSON.stringify(b.value)) {
                    throw new Error("Incompatible dimensions: values must match for addition.");
                }else if(a.power !== b.power){
                    throw new Error("Incompatible dimensions: unknown variable powers must match for addition.");
                }
                result.variable = a.variable;
                result.known = a.known;
                result.power = a.power;
            } else {
                throw new Error("Cannot add/subtract two unknown dimensions.");
            }

            // Merge var_vals from both input maps into result's var_vals map
            for (const [key, value] of a.var_vals) {
                result.var_vals.set(key, value);
            }
            for (const [key, value] of b.var_vals) {
                result.var_vals.set(key, value);
            }

            return result;
        },
        'Unit, Dimension': function(a, b){
            return math.add(new Dimension(a.dimensions), b);
        },
        'Dimension, Unit': function(a, b){
            return math.add(new Dimension(b.dimensions), a);
        }
    });

    // Subtraction has the same behavior as addition
    const subtract = math.typed('subtract', add.signatures);

    // Multiplication rule for Dimension class
    const multiply = math.typed('multiply', {
        'Dimension, Dimension': function (a, b) {
            const resultValue = a.value.map((val, i) => val + b.value[i]);

            // If one of the dimensions is unknown, propagate its variable to the result
            const resultVariable = a.known ? b.variable : a.variable;
            const resultPower = a.known ? b.power : a.power;
            const result = new Dimension(resultValue, resultVariable);
            result.power = resultPower;
            result.known = a.known && b.known;

            if(!a.known && !b.known) {
                if(a.variable == b.variable){
                    result.power = a.power + b.power;
                } else {
                    throw new Error("Cannot multiply two unknown dimensions.");
                }
            }

            // Merge var_vals from both input maps into result's var_vals map
            for (const [key, value] of a.var_vals) {
                result.var_vals.set(key, value);
            }
            for (const [key, value] of b.var_vals) {
                result.var_vals.set(key, value);
            }

            return result;
        },
        'Dimension, number': function (a, b){
            return a;
        },
        'number, Dimension': function (a, b){
            return b;
        }
    });


    // Multiplication rule for Dimension class
    const divide = math.typed('divide', {
        'Dimension, Dimension': function (a, b) {
            const resultValue = a.value.map((val, i) => val - b.value[i]);

            // If one of the dimensions is unknown, propagate its variable to the result
            const resultVariable = a.known ? b.variable : a.variable;
            const resultPower = a.known ? -b.power : a.power;
            const result = new Dimension(resultValue, resultVariable);
            result.power = resultPower;
            result.known = a.known && b.known;

            if(!a.known && !b.known) {
                if(a.variable == b.variable){
                    result.power = a.power - b.power;
                } else {
                    throw new Error("Cannot divide two unknown dimensions.");
                }
            }

            // Merge var_vals from both input maps into result's var_vals map
            for (const [key, value] of a.var_vals) {
                result.var_vals.set(key, value);
            }
            for (const [key, value] of b.var_vals) {
                result.var_vals.set(key, value);
            }

            return result;
        },
        'number, Dimension': function (a, b){
            const resultValue = b.value.map((val, i) => -val);
            const result = new Dimension(resultValue, b.variable);
            result.known = b.known;
            result.power = -b.power;
            result.var_vals = b.var_vals;
            return result;
        },
        'Dimension, number': function (a, b){
            return a;
        }
    });

    // Multiplication rule for Dimension class
    const pow = math.typed('pow', {
        'Dimension, number': function (a, b) {
            const resultValue = a.value.map((val, i) => val*b);
            const result = new Dimension(resultValue, a.variable);
            result.known = a.known;
            result.power = a.power*b;
            result.var_vals = a.var_vals;

            return result;
        }
    });

    function dimension(value, variable = null){
        return new Dimension(value, variable);
    }

    // import in math.js, extend the existing function `add` with support for Dimension
    math.import({add: add, subtract : subtract, multiply : multiply, divide : divide, pow : pow, dimension : dimension});
}catch(error){
    console.log(error.message);
}