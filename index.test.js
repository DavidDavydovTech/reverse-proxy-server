const Urusai = require('./index.js');
let test = new Urusai();

test ('Urusai exposes its handlers', () => {
    expect(Object.keys(test.handlers).length).toBeGreaterThan(0);
});