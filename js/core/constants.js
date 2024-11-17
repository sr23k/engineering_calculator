// Create parser with all units available
const parser = math.parser();
const equations = {};

// Add engineering constants (extending math.js built-in constants)
const engineeringConstants = {
    // Standard gravity
    g: math.unit('9.80665 m/s^2'),
    // Gas constant
    R: math.unit('8.31446261815324 J/(mol*K)'),
    // Boltzmann constant
    k: math.unit('1.380649e-23 J/K'),
    // Stefan-Boltzmann constant
    sigma: math.unit('5.670374419e-8 W/(m^2*K^4)'),
    // Planck constant
    h: math.unit('6.62607015e-34 J*s'),
    // Speed of light
    c: math.unit('299792458 m/s'),
    // Electron mass
    me: math.unit('9.1093837015e-31 kg'),
    // Proton mass
    mp: math.unit('1.67262192369e-27 kg'),
    // Atmospheric pressure
    atm: math.unit('101325 Pa'),
    // Water properties at standard conditions
    rho_water: math.unit('998 kg/m^3'),
    cp_water: math.unit('4186 J/(kg*K)'),
    // Air properties at standard conditions
    rho_air: math.unit('1.225 kg/m^3'),
    cp_air: math.unit('1005 J/(kg*K)')
};

// Add constants to parser
Object.entries(engineeringConstants).forEach(([name, value]) => {
    parser.set(name, value);
});
