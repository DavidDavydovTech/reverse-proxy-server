const Urusai = require('./index.js');

test ('Urusai exposes its handlers', () => {
    let test = new Urusai();
    expect(Object.keys(test.handlers).length).toBeGreaterThan(0);
});